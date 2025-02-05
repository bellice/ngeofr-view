from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import duckdb
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Autoriser les requêtes CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_query(global_filter, filter_column, filter_value, sort_field, sort_order):
    query = "SELECT * FROM read_parquet('data/ngeo2024.parquet')"
    where_clauses = []
    params = []

    if global_filter:
        where_clauses.append("(LOWER(com_insee) LIKE LOWER(?) OR "
                            "LOWER(com_nom) LIKE LOWER(?) OR "
                            "LOWER(reg_insee) LIKE LOWER(?) OR "
                            "LOWER(reg_nom) LIKE LOWER(?) OR "
                            "LOWER(dep_insee) LIKE LOWER(?) OR "
                            "LOWER(dep_nom) LIKE LOWER(?) OR "
                            "LOWER(epci_siren) LIKE LOWER(?) OR "
                            "LOWER(epci_nom) LIKE LOWER(?) OR "
                            "LOWER(epci_naturejuridique) LIKE LOWER(?))")
        params.extend([f"%{global_filter}%"] * 9)

    if filter_column and filter_value:
        where_clauses.append(f"LOWER({filter_column}) LIKE LOWER(?)")
        params.append(f"%{filter_value}%")

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    if sort_field:
        query += f"""
            ORDER BY lower(regexp_replace(strip_accents({sort_field}), '[^a-zA-Z0-9]', '', 'g'))
            {sort_order.upper()}
        """

    return query, params

@app.get("/data")
def get_data(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1),
    filter_column: str = Query(None),
    filter_value: str = Query(None),
    global_filter: str = Query(None),
    sort_field: str = Query(None),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
):
    try:
        conn = duckdb.connect()

        # Construire la requête SQL
        query, params = build_query(global_filter, filter_column, filter_value, sort_field, sort_order)

        # Récupérer le nombre total de lignes après filtrage
        total_query = f"SELECT COUNT(*) FROM ({query})"
        total_rows = conn.execute(total_query, params).fetchone()[0]

        # Ajouter la pagination
        offset = (page - 1) * page_size
        query += f" LIMIT ? OFFSET ?"
        params.extend([page_size, offset])

        # Exécuter la requête
        data = conn.execute(query, params).fetchall()
        columns = [col[0] for col in conn.description]
        conn.close()

        # Transformer les tableaux en objets
        formatted_data = [dict(zip(columns, row)) for row in data]
        return {
            "last_page": (total_rows + page_size - 1) // page_size,
            "columns": columns,
            "data": formatted_data,
            "total_rows": total_rows,
        }

    except Exception as e:
        logger.error(f"Erreur : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Démarrer le serveur avec : uvicorn backend.main:app --reload

# Si données lourdes
# 1/ Pagination côté serveur
# 2/ Filtrage côté serveur
# 3/ Virtual DOM et rendu différé
# 4/ Limiter les colonnes affichées
# 5/ Compression des données
# 6/ Utiliser un backend plus performant


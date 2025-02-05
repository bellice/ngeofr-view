let table;


// Fonction pour récupérer les données
async function fetchData() {
  const response = await fetch('http://localhost:8000/data');
  const result = await response.json();
  return result;
}

fetchData().then(result => {
  table = new Tabulator("#table", {
      layout: "fitDataFill",
      pagination: true,
      scrollToColumnIfVisible: false,
      paginationMode: "remote",
      filterMode: "remote",
      sortMode: "remote",
      paginationSize: 25,
      paginationSizeSelector: [25, 50],
      ajaxURL: "http://localhost:8000/data",
      ajaxParams: function() {
          const sorters = this.getSorters();
          const sortField = sorters.length > 0 ? sorters[0].field : null;
          const sortOrder = sorters.length > 0 ? sorters[0].dir : null;

          const filters = this.getHeaderFilters();
          let filterColumn = null;
          let filterValue = null;

          // Prendre le premier filtre actif
          if (filters.length > 0) {
              filterColumn = filters[0].field;
              filterValue = filters[0].value;
          }

          const globalFilterValue = document.getElementById("global-filter").value;

          return {
              page: table.getPage(),
              page_size: table.getPageSize(),
              sort_field: sortField,
              sort_order: sortOrder,
              filter_column: filterColumn, // Envoyer la colonne de filtre
              filter_value: filterValue,  // Envoyer la valeur de filtre
              global_filter: globalFilterValue,  // Valeur du filtre global
          };
      },
      ajaxResponse: function(url, params, response) {
          console.log("Réponse du serveur reçue:", response); // Log de la réponse
          totalRows = response.total_rows;

          return {
              last_page: response.last_page,
              data: response.data,
          };
      },
      columns: [
          { 
              title: "Code commune", 
              field: "com_insee", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par commune...",
              sorter: true,
          },
          { 
              title: "Nom commune", 
              field: "com_nom", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par commune...",
              sorter: true,
          },
          { 
              title: "Code région", 
              field: "reg_insee", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par région...",
              sorter: true,
          },
          { 
              title: "Nom région", 
              field: "reg_nom", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par région...",
              sorter: true,
          },
          { 
              title: "Code département", 
              field: "dep_insee", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par département...",
              sorter: true,
          },
          { 
              title: "Nom département", 
              field: "dep_nom", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par département...",
              sorter: true,
          },
          { 
              title: "Code epci", 
              field: "epci_siren", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par epci...",
              sorter: true,
          },
          { 
              title: "Nom epci", 
              field: "epci_nom", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par epci...",
              sorter: true,
          },
          { 
              title: "Nature juridique epci", 
              field: "epci_naturejuridique", 
              headerFilter: "input",
              headerFilterPlaceholder: "Filtrer par epci...",
              sorter: true,
          },
      ],
      footerElement: `<div id="table-footer"></div>`,
      ajaxRequesting: function() {
        console.log("Requête en cours...");
      },
      ajaxCompleted: function() {
        console.log("Requête terminée.");
      },
  });

  // Mettre à jour les informations de pagination dans le footer
  table.on("dataLoaded", function(data) {
      const page = table.getPage();
      const pageSize = table.getPageSize();
      const totalPages = table.getPageMax();

      document.getElementById("table-footer").innerHTML = `
          Page ${page} sur ${totalPages} | Total des résultats : ${totalRows}
      `;
  });

  let debounceTimer;
  // Écouter le changement dans l'input global et appliquer le filtre
  document.getElementById("global-filter").addEventListener("input", function() {
    // Annuler le timer précédent
    clearTimeout(debounceTimer);

    // Démarrer un nouveau timer de 300ms
    debounceTimer = setTimeout(function() {
        // Recharger les données avec le nouveau filtre global après 300ms
        table.setData();   // Recharger les données avec le nouveau filtre global
    }, 300);
  });
});
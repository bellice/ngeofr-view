from livereload import Server

# Démarrer le serveur livereload
server = Server()
server.watch("frontend/*.html")  # Surveiller les fichiers HTML
server.watch("frontend/*.css")   # Surveiller les fichiers CSS
server.watch("frontend/*.js")    # Surveiller les fichiers JS
server.serve(port=35729, host="0.0.0.0")  # Port par défaut de livereload
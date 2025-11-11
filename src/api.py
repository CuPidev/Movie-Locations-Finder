"""Flask API to serve heritage site search results."""

import os
from typing import Optional
from flask import Flask, send_from_directory
from flask_cors import CORS

from src.indexer import Indexer


ROOT = os.path.dirname(os.path.dirname(__file__))


def create_app(static_folder: Optional[str] = None):
    if static_folder is None:
        # React built frontend
        static_folder = os.path.join(ROOT, "frontend/dist")

    app = Flask(__name__, static_folder=static_folder, static_url_path="")
    CORS(app)

    @app.route("/", defaults={"path": "index.html"})
    @app.route("/<path:path>")
    def serve_frontend(path):
        # serve static frontend files from frontend/dist
        if app.static_folder and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return ("Not Found", 404)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)

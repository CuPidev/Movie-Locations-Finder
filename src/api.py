"""Flask API to serve heritage site search results."""

import os
from typing import Optional
from flask import Flask, send_from_directory, request
from flask_cors import CORS

from src.indexer import Indexer


ROOT = os.path.dirname(os.path.dirname(__file__))


def create_app(static_folder: Optional[str] = None):
    if static_folder is None:
        # React built frontend
        static_folder = os.path.join(ROOT, "frontend/dist")

    app = Flask(__name__, static_folder=static_folder, static_url_path="")
    CORS(app)

    @app.route("/api/search")
    def search():
        query = request.args.get("q", "")
        print(f"[DEBUG] Received query: '{query}'")
        if not query:
            return {"results": []}
        
        indexer = Indexer()
        try:
            results = indexer.search(query)
            print(f"[DEBUG] Search returned: {results}")
            print(f"[DEBUG] Results type: {type(results)}")
            # Convert results to list of dicts
            results_list = []
            for doc in results:
                results_list.append(dict(doc))
            print(f"[DEBUG] Converted to list, length: {len(results_list)}")
            return {"results": results_list}
        except Exception as e:
            print(f"Search failed: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to mock data for demonstration if Solr is down
            return {"results": [
                {
                    "id": "mock-1",
                    "name": "Mock Heritage Site (Solr Unavailable)",
                    "description": "This is a mock result because the Solr server could not be reached. Please ensure Apache Solr is running.",
                    "country": "Demo Land",
                    "score": 1.0
                },
                {
                    "id": "mock-2",
                    "name": "Another Mock Site",
                    "description": "Solr integration is implemented, but the server is offline.",
                    "country": "Test Country",
                    "score": 0.8
                }
            ]}

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

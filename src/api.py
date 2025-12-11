"""Flask API to serve the movie locations app and solr search results."""

import os
from typing import Optional

from flask import Flask, request, send_from_directory
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
            return {"results": results.docs}
        except Exception as e:
            print(f"Search failed: {e}")
            import traceback

            traceback.print_exc()
            # Fallback to mock data for demonstration if Solr is down
            return {
                "results": [
                    {
                        "id": "mock-1",
                        "title": "Mock Movie (Solr Unavailable)",
                        "content": "This is a mock result because the Solr server could not be reached. Please ensure Apache Solr is running.",
                    },
                    {
                        "id": "mock-2",
                        "title": "Another Mock Movie",
                        "content": "Solr integration is implemented, but the server is offline.",
                    },
                ]
            }

    @app.route("/", defaults={"path": "index.html"})
    @app.route("/<path:path>")
    def serve_frontend(path):
        # serve static frontend files from frontend/dist
        if app.static_folder and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return ("Not Found", 404)

    @app.route("/api/browse")
    def browse():
        # Provide simple browsing/pagination endpoint backed by Solr
        try:
            offset = int(request.args.get("offset", "0") or "0")
        except Exception:
            offset = 0
        try:
            limit = int(request.args.get("limit", "10") or "10")
        except Exception:
            limit = 10
        q = request.args.get("q", "")
        shuffle = request.args.get("shuffle") == "1"

        indexer = Indexer()
        try:
            results = indexer.browse(
                query=q or None, offset=offset, limit=limit, shuffle=shuffle
            )
            items = [dict(d) for d in results]
            total = getattr(results, "hits", len(items))
            return {"total": total, "items": items}
        except Exception as e:
            print(f"Browse failed: {e}")
            import traceback

            traceback.print_exc()
            return {
                "total": 2,
                "items": [
                    {
                        "id": "mock-1",
                        "title": "Mock Movie (Solr Unavailable)",
                        "content": "This is a mock result because the Solr server could not be reached. Please ensure Apache Solr is running.",
                        "country": "Demo Land",
                        "score": 1.0,
                    },
                    {
                        "id": "mock-2",
                        "title": "Another Mock Site",
                        "content": "Solr integration is implemented, but the server is offline.",
                        "country": "Test Country",
                        "score": 0.8,
                    },
                ],
            }
            
    @app.route("/api/more-like-this")
    def more_like_this():
        doc_id = request.args.get("id")
        if not doc_id:
            return {"error": "Missing 'id' parameter"}, 400
            
        indexer = Indexer()
        try:
            results = indexer.more_like_this(doc_id)
            # pysolr more_like_this returns a specialized object, but usually it behaves mostly like results
            # The structure might differ slightly depending on pysolr version, but usually it's iterable
            items = [dict(d) for d in results]
            return {"results": items}
        except Exception as e:
            print(f"More Like This failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                "results": [
                    {
                        "id": "mock-sim-1",
                        "title": "Similar Mock Movie",
                        "content": "Simulated similar content because Solr failed.",
                        "score": 0.9
                    }
                ]
            }

    @app.route("/api/locations/grouped")
    def locations_grouped():
        """Search with results grouped by location name."""
        q = request.args.get("q", "")
        try:
            limit = int(request.args.get("limit", "10") or "10")
        except Exception:
            limit = 10
        try:
            group_limit = int(request.args.get("group_limit", "5") or "5")
        except Exception:
            group_limit = 5
            
        indexer = Indexer()
        try:
            results = indexer.group_by_location(query=q or None, limit=limit, group_limit=group_limit)
            # Parse grouped response - pysolr returns grouped results differently
            raw = results.raw_response
            grouped = raw.get("grouped", {}).get("location_name", {})
            groups = grouped.get("groups", [])
            n_groups = grouped.get("ngroups", len(groups))
            
            # Format response
            formatted_groups = []
            for g in groups:
                formatted_groups.append({
                    "location_name": g.get("groupValue", "Unknown"),
                    "count": g.get("doclist", {}).get("numFound", 0),
                    "movies": g.get("doclist", {}).get("docs", [])
                })
            
            return {"total_locations": n_groups, "groups": formatted_groups}
        except Exception as e:
            print(f"Grouped search failed: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e), "total_locations": 0, "groups": []}

    @app.route("/api/locations/nearby")
    def locations_nearby():
        """Find filming locations near a geographic point."""
        try:
            lat = float(request.args.get("lat", "0"))
            lon = float(request.args.get("lon", "0"))
        except (ValueError, TypeError):
            return {"error": "Invalid lat/lon parameters"}, 400
            
        try:
            radius = float(request.args.get("radius", "50"))
        except Exception:
            radius = 50
        try:
            limit = int(request.args.get("limit", "20") or "20")
        except Exception:
            limit = 20
            
        indexer = Indexer()
        try:
            results = indexer.nearby_locations(lat=lat, lon=lon, radius_km=radius, limit=limit)
            items = [dict(d) for d in results]
            return {"results": items, "center": {"lat": lat, "lon": lon}, "radius_km": radius}
        except Exception as e:
            print(f"Nearby locations search failed: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e), "results": []}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)

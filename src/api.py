"""Flask API to serve the movie locations app and solr search results."""

import os
from typing import Optional

from flask import Flask, request, send_from_directory
from flask_cors import CORS

from src.indexer import Indexer
import json

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

        # Get the number of results to return (k parameter)
        try:
            k = int(request.args.get("k", "10") or "10")
        except Exception:
            k = 10

        indexer = Indexer()
        try:
            results = indexer.search(query, clustering=True, rows=k)
            print(f"[DEBUG] Results: {results}")
            # WHY THE FUCK DOES CLUSTERING NOT WORK

            # Extract clusters from raw response
            clusters = []
            if hasattr(results, "raw_response"):
                # Print top-level keys so we can inspect what Solr actually returned
                rr = results.raw_response
                print(f"[DEBUG] raw_response keys: {list(rr.keys())}")
                try:
                    # Print a short snippet of the raw response for debugging
                    snippet = json.dumps(rr, indent=2)[:2000]
                    print(f"[DEBUG] raw_response snippet:\n{snippet}")
                except Exception:
                    # Fallback - some responses may not be JSON-serializable
                    print(
                        "[DEBUG] raw_response (non-serializable) - length:",
                        len(str(rr)),
                    )

                # Clusters can appear in many shapes depending on Solr / Carrot2 / version.
                def extract_clusters(obj):
                    """Recursively find cluster-like dicts in the response."""
                    found = []
                    if isinstance(obj, dict):
                        # Typical top-level keys
                        if "clusters" in obj and isinstance(obj["clusters"], list):
                            found.extend(obj["clusters"])
                        if "cluster" in obj and isinstance(obj["cluster"], list):
                            found.extend(obj["cluster"])
                        # 'clustering' wrapper
                        if "clustering" in obj and isinstance(
                            obj.get("clustering"), dict
                        ):
                            found.extend(extract_clusters(obj.get("clustering")))

                        # Walk nested dicts/lists to discover embedded cluster objects
                        for v in obj.values():
                            if isinstance(v, dict):
                                found.extend(extract_clusters(v))
                            elif isinstance(v, list):
                                for item in v:
                                    if isinstance(item, dict):
                                        # Heuristic: cluster dicts often contain 'labels' or 'docs' or 'resultIds' or 'results' or 'documents'
                                        if any(
                                            k in item
                                            for k in (
                                                "labels",
                                                "docs",
                                                "resultIds",
                                                "results",
                                                "documents",
                                            )
                                        ):
                                            found.append(item)
                                        else:
                                            found.extend(extract_clusters(item))
                    elif isinstance(obj, list):
                        for item in obj:
                            if isinstance(item, dict):
                                if any(
                                    k in item
                                    for k in (
                                        "labels",
                                        "docs",
                                        "resultIds",
                                        "results",
                                        "documents",
                                    )
                                ):
                                    found.append(item)
                                else:
                                    found.extend(extract_clusters(item))
                    return found

                raw_clusters = extract_clusters(rr)
                print(
                    f"[DEBUG] Found {len(raw_clusters)} raw clusters in response (after extraction)"
                )

                def normalize_labels(raw_labels):
                    out = []
                    for l in raw_labels or []:
                        if isinstance(l, dict):
                            out.append(l.get("text") or l.get("label"))
                        else:
                            out.append(l)
                    return [x for x in out if x]

                def normalize_docs(raw_docs):
                    out = []
                    for d in raw_docs or []:
                        if isinstance(d, str):
                            out.append(d)
                        elif isinstance(d, dict):
                            # try common id keys
                            out.append(d.get("id") or d.get("docId") or d.get("_id"))
                        else:
                            out.append(str(d))
                    return [x for x in out if x]

                for c in raw_clusters:
                    if not isinstance(c, dict):
                        continue

                    labels = normalize_labels(c.get("labels") or c.get("label") or [])

                    docs = []
                    # Many cluster formats use different keys
                    for key in ("docs", "resultIds", "results", "documents"):
                        if key in c:
                            docs = normalize_docs(c.get(key) or [])
                            break

                    # Some clustering engines put member ids under 'documents' as dicts with 'id' field
                    if labels and docs:
                        clusters.append({"labels": labels, "docs": docs})

                if not clusters:
                    print(
                        "[DEBUG] No usable clusters parsed from raw response; full raw_response printed above"
                    )
                if not clusters:
                    print("[DEBUG] No usable clusters parsed from raw response")

                # Normalize each cluster's docs to remove duplicate IDs while preserving order
                for c in clusters:
                    seen_docs = []
                    new_docs = []
                    for d in c.get("docs", []):
                        if d not in seen_docs:
                            seen_docs.append(d)
                            new_docs.append(d)
                    c["docs"] = new_docs

                # Merge clusters that have identical sets of labels (order-insensitive, case-insensitive)
                def canonical_label(s):
                    return (s or "").strip().lower()

                merged = {}
                # Keep original label lists for order-preserving dedup later
                original_labels_by_key = {}

                for c in clusters:
                    labels = c.get("labels", [])
                    # Compute normalized set of labels as merge key
                    norm_set = frozenset(
                        canonical_label(l) for l in labels if canonical_label(l)
                    )
                    if norm_set in merged:
                        merged[norm_set]["docs"].extend(c.get("docs", []))
                    else:
                        merged[norm_set] = {"docs": list(c.get("docs", []))}
                        original_labels_by_key[norm_set] = labels

                # Remove duplicate docs within merged clusters and preserve original order
                final_clusters = []
                for key in merged:
                    m = merged[key]
                    seen_docs = set()
                    uniq_docs = []
                    for d in m["docs"]:
                        if d not in seen_docs:
                            seen_docs.add(d)
                            uniq_docs.append(d)

                    # Recreate labels preserving first-seen original order but deduplicated case-insensitively
                    seen_labels = set()
                    uniq_labels = []
                    for l in original_labels_by_key.get(key, []):
                        nl = canonical_label(l)
                        if nl and nl not in seen_labels:
                            seen_labels.add(nl)
                            uniq_labels.append(l)

                    final_clusters.append({"labels": uniq_labels, "docs": uniq_docs})

                # Map returned clusters to actual result documents when available and add counts
                id_map = {
                    str(d.get("id")): d
                    for d in getattr(results, "docs", [])
                    if isinstance(d, dict) and d.get("id")
                }
                enriched = []
                for c in final_clusters:
                    docs_ids = c.get("docs", [])
                    sample_docs = [
                        id_map.get(str(d)) for d in docs_ids if id_map.get(str(d))
                    ]
                    # keep only first 5 samples for quick display
                    sample_docs = sample_docs[:5]
                    enriched.append(
                        {
                            "labels": c.get("labels", []),
                            "doc_ids": docs_ids,
                            "count": len(docs_ids),
                            "sample_docs": sample_docs,
                        }
                    )

                # Sort topics descending by count
                enriched = sorted(
                    enriched, key=lambda x: x.get("count", 0), reverse=True
                )

            return {"results": results.docs, "clusters": enriched}
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
                        "score": 0.9,
                    }
                ]
            }

    @app.route("/api/cluster-docs", methods=["POST"])
    def cluster_docs():
        """Return full documents for a list of doc ids passed in the request body as JSON {"ids": [...]}."""
        try:
            data = request.get_json(silent=True) or {}
            ids = data.get("ids") or []
            if not ids:
                # Fallback to query params like ?id=1&id=2
                ids = request.args.getlist("id") or []
            if isinstance(ids, str):
                ids = [i.strip() for i in ids.split(",") if i.strip()]

            indexer = Indexer()
            docs = indexer.get_docs_by_ids(ids)
            return {"results": docs}
        except Exception as e:
            print(f"cluster-docs failed: {e}")
            import traceback

            traceback.print_exc()
            return {"results": []}, 500

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
            results = indexer.group_by_location(
                query=q or None, limit=limit, group_limit=group_limit
            )
            # Parse grouped response - pysolr returns grouped results differently
            raw = results.raw_response
            grouped = raw.get("grouped", {}).get("location_name", {})
            groups = grouped.get("groups", [])
            n_groups = grouped.get("ngroups", len(groups))

            # Format response
            formatted_groups = []
            for g in groups:
                formatted_groups.append(
                    {
                        "location_name": g.get("groupValue", "Unknown"),
                        "count": g.get("doclist", {}).get("numFound", 0),
                        "movies": g.get("doclist", {}).get("docs", []),
                    }
                )

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
            results = indexer.nearby_locations(
                lat=lat, lon=lon, radius_km=radius, limit=limit
            )
            items = [dict(d) for d in results]
            return {
                "results": items,
                "center": {"lat": lat, "lon": lon},
                "radius_km": radius,
            }
        except Exception as e:
            print(f"Nearby locations search failed: {e}")
            import traceback

            traceback.print_exc()
            return {"error": str(e), "results": []}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)

import json
import os
import sys
import time

# ensure project root is on sys.path
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.indexer import Indexer

def index_data():
    # If a specific file is provided, use that. Otherwise scan data/ folder.
    files_to_index = []
    
    if len(sys.argv) > 1:
        provided_path = sys.argv[1]
        if os.path.exists(provided_path):
            files_to_index.append(provided_path)
        else:
            print(f"Error: {provided_path} not found.")
            return
    else:
        # Default: scan data directory
        data_dir = os.path.join(ROOT, "data")
        if os.path.exists(data_dir):
            for f in os.listdir(data_dir):
                if f.endswith(".json"):
                    files_to_index.append(os.path.join(data_dir, f))
        else:
             print(f"Error: Data directory {data_dir} not found.")
             return

    if not files_to_index:
        print("No data files found to index.")
        return

    # Get Solr URL from environment or use default
    solr_url = os.getenv("SOLR_URL", "http://localhost:8983/solr/movies")
    print(f"Connecting to Solr at: {solr_url}")
    indexer = Indexer(solr_url=solr_url)
    
    # Clean index before adding new documents
    print("Cleaning existing Solr index...")
    indexer.delete_all()

    total_indexed = 0

    for data_path in files_to_index:
        print(f"\nProcessing {data_path}...")
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                documents = []
                # First try reading as a whole JSON array if it starts with [
                f.seek(0)
                first_char = f.read(1)
                f.seek(0)
                if first_char == '[':
                    try:
                        data = json.load(f)
                        documents = data
                    except json.JSONDecodeError as e:
                         print(f"Error decoding JSON array in {data_path}: {e}")
                else:
                    # Assume NDJSON
                    try:
                        for line in f:
                            if line.strip():
                                documents.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        print(f"Error decoding NDJSON in {data_path}: {e}")

            if not documents:
                print(f"No valid documents found in {data_path}, skipping.")
                continue

            print(f"Found {len(documents)} movies in {os.path.basename(data_path)}.")

            # Prepare documents for Solr - one document per LOCATION (not per movie)
            # This enables grouping by location and spatial queries
            solr_docs = []
            for doc in documents:
                movie_title = doc.get("title", "")
                movie_url = doc.get("url", "")
                movie_image = doc.get("image", "")
                movie_content = doc.get("text_content", "")
                locations = doc.get("locations", [])
                
                if not locations:
                    # Movie with no locations - create a single document
                    solr_docs.append({
                        "id": movie_url or f"movie_{len(solr_docs)}",
                        "movie_title": movie_title,
                        "title": movie_title,  # Keep for backwards compatibility
                        "content": movie_content,
                        "url": movie_url,
                        "movie_image": movie_image,
                        "image": movie_image,
                    })
                else:
                    # Create one document per location
                    for idx, loc in enumerate(locations):
                        loc_name = loc.get("name") or "Unknown Location"
                        lat = loc.get("latitude") or 0
                        lon = loc.get("longitude") or 0
                        loc_address = loc.get("address") or ""
                        loc_description = loc.get("description") or ""
                        loc_image = loc.get("image") or ""
                        
                        # Build unique ID for this location
                        loc_id = f"{movie_url}__loc_{idx}" if movie_url else f"loc_{len(solr_docs)}"
                        
                        solr_doc = {
                            "id": loc_id,
                            "location_name": loc_name,
                            "location_address": loc_address,
                            "location_description": loc_description,
                            "location_image": loc_image,
                            "movie_title": movie_title,
                            "title": f"{loc_name} - {movie_title}",  # Combined for search
                            "content": f"{loc_name} {loc_address} {loc_description}",
                            "url": movie_url,
                            "movie_image": movie_image,
                            "image": loc_image or movie_image,
                        }
                        
                        # Add spatial field if valid coordinates exist
                        if lat is not None and lon is not None:
                            try:
                                lat_f = float(lat)
                                lon_f = float(lon)
                                # Only add if coordinates are valid (not 0,0 which is often missing data)
                                if not (lat_f == 0 and lon_f == 0):
                                    solr_doc["location_pt"] = f"{lat_f},{lon_f}"
                                    solr_doc["latitude"] = lat_f
                                    solr_doc["longitude"] = lon_f
                            except (ValueError, TypeError):
                                pass  # Skip invalid coordinates
                        
                        solr_docs.append(solr_doc)

            batch_size = 100
            print(f"Indexing {len(solr_docs)} documents...")
            
            for i in range(0, len(solr_docs), batch_size):
                batch = solr_docs[i : i + batch_size]
                try:
                    indexer.add_documents(batch)
                    # print(f"Indexed {i + len(batch)} / {len(solr_docs)}")
                except Exception as e:
                    print(f"Error indexing batch {i} from {data_path}: {e}")
            
            total_indexed += len(solr_docs)
            print(f"Finished indexing {data_path}.")
            
        except Exception as e:
            print(f"Failed to process file {data_path}: {e}")

    print(f"\nTotal documents indexed across all files: {total_indexed}")

if __name__ == "__main__":
    index_data()

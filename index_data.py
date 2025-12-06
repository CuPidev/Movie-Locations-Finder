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

            print(f"Found {len(documents)} documents in {os.path.basename(data_path)}.")

            # Prepare documents for Solr
            solr_docs = []
            for i, doc in enumerate(documents):
                solr_doc = {
                    "id": doc.get("url", f"doc_{i}_{os.path.basename(data_path)}"),
                    "title": doc.get("title", ""),
                    "content": doc.get("text_content", ""),
                    "url": doc.get("url", ""),
                    "country": doc.get("country", "")
                }
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

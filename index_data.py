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
    data_path = os.path.join(ROOT, "data", "movie_locations.json")
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    print(f"Reading data from {data_path}...")
    with open(data_path, "r", encoding="utf-8") as f:
        # The file seems to be line-delimited JSON or a list of JSON objects?
        # Based on the view_file output, it looks like line-delimited JSON (NDJSON) 
        # because line 1 is a complete JSON object and line 2 is another.
        # Let's try reading line by line.
        documents = []
        try:
            # First try reading as a whole JSON array if it starts with [
            f.seek(0)
            first_char = f.read(1)
            f.seek(0)
            if first_char == '[':
                data = json.load(f)
                documents = data
            else:
                # Assume NDJSON
                for line in f:
                    if line.strip():
                        documents.append(json.loads(line))
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            return

    print(f"Found {len(documents)} documents.")

    # Get Solr URL from environment or use default
    solr_url = os.getenv("SOLR_URL", "http://localhost:8983/solr/movies")
    print(f"Connecting to Solr at: {solr_url}")
    
    indexer = Indexer(solr_url=solr_url)

    
    # Prepare documents for Solr
    solr_docs = []
    for i, doc in enumerate(documents):
        # Map fields
        # Solr schema usually has 'id'
        solr_doc = {
            "id": doc.get("url", f"doc_{i}"),
            "title": doc.get("title", ""),
            "content": doc.get("text_content", ""),
            "url": doc.get("url", ""),
            "country": doc.get("country", "") # Might not exist in all, but good to have
        }
        solr_docs.append(solr_doc)

    batch_size = 100
    print(f"Indexing {len(solr_docs)} documents in batches of {batch_size}...")
    
    start_time = time.time()
    for i in range(0, len(solr_docs), batch_size):
        batch = solr_docs[i : i + batch_size]
        try:
            indexer.add_documents(batch)
            print(f"Indexed {i + len(batch)} / {len(solr_docs)}")
        except Exception as e:
            print(f"Error indexing batch {i}: {e}")
            # If Solr is not running, this will fail.
            print("Make sure Solr is running!")
            break
            
    end_time = time.time()
    print(f"Done in {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    index_data()

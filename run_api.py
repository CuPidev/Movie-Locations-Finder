"""Small runner to start the Flask app with correct sys.path.

Use when `python -m src.api` fails because the package isn't on sys.path in this environment.
"""

import os
import sys

from src.indexer import Indexer

# ensure project root is on sys.path so `import src` works
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.api import create_app

if __name__ == "__main__":
    # indexer = Indexer()
    # indexer.add_document("doc1", "This is a sample heritage site document.")

    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=False)

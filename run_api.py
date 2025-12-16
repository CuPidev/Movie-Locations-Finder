"""Small runner to start the Flask app from anywhere in the system."""

import os
import sys

# ensure project root is on sys.path so `import src` works
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.api import create_app

if __name__ == "__main__":
    # Use fixed host/port suitable for docker-compose; no envs used
    host = "127.0.0.1"
    port = 5001
    debug = False

    app = create_app()
    app.run(host=host, port=port, debug=debug)

import os
import urllib.request
import zipfile
import subprocess
import time
import sys

SOLR_VERSION = "9.8.0" # Found on archive
SOLR_ZIP = f"solr-{SOLR_VERSION}.zip"
SOLR_DIR = f"solr-{SOLR_VERSION}"
SOLR_URL = f"https://archive.apache.org/dist/solr/solr/{SOLR_VERSION}/{SOLR_ZIP}"

def install_and_run_solr():
    # 1. Download
    if not os.path.exists(SOLR_ZIP):
        print(f"Downloading {SOLR_ZIP} from {SOLR_URL}...")
        try:
            urllib.request.urlretrieve(SOLR_URL, SOLR_ZIP)
            print("Download complete.")
        except Exception as e:
            print(f"Failed to download: {e}")
            return

    # 2. Extract
    if not os.path.exists(SOLR_DIR):
        print(f"Extracting {SOLR_ZIP}...")
        with zipfile.ZipFile(SOLR_ZIP, 'r') as zip_ref:
            zip_ref.extractall(".")
        print("Extraction complete.")

    # 3. Start Solr
    print("Starting Solr...")
    bin_dir = os.path.join(SOLR_DIR, "bin")
    solr_cmd = os.path.join(bin_dir, "solr.cmd")
    
    # Check if solr is already running? 
    # We can just try to create the core, if it fails it might be because solr is down or core exists.
    # Let's just run start. It handles "already running" gracefully usually.
    
    try:
        # Start Solr and create core 'heritage_sites'
        # -c heritage_sites creates the core if it doesn't exist
        cmd = [solr_cmd, "start", "-c", "heritage_sites"]
        print(f"Running: {' '.join(cmd)}")
        subprocess.check_call(cmd, shell=True)
        print("Solr started successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error starting Solr: {e}")
        print("Attempting to start without creating core (maybe it exists)...")
        try:
             subprocess.check_call([solr_cmd, "start"], shell=True)
        except:
             pass

    print("Waiting for Solr to be ready...")
    time.sleep(5)
    print("Setup finished.")

if __name__ == "__main__":
    install_and_run_solr()

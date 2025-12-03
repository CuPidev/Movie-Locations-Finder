# Solr Deployment Workflow

This document explains how Apache Solr is integrated into the GitHub Actions deployment workflow for the Movie Sites Finder project.

## Overview

The deployment workflow automatically sets up and configures Apache Solr on the VPS server, ensuring the search functionality works in production without manual intervention.

## Workflow Steps

### 1. **Build Frontend**
The workflow builds the React frontend using Vite and Yarn.

### 2. **Create Deployment Package**
Creates a tarball containing:
- Built frontend (`frontend/dist`)
- Python backend code (`src/`, `run_api.py`, `index_data.py`)
- Deployment scripts (`deployment/`)
- Data file (`movie_locations.json`)

Excludes:
- Git repository (`.git`)
- Python virtual environment (`.venv`)
- Local Solr installation (`solr-9.10.0`)
- Data directory (`data`)

### 3. **Transfer to VPS**
Uploads the tarball to the VPS server via SCP.

### 4. **Solr Setup**
Runs `deployment/setup_solr_vps.sh` which:
- Checks for Java 11+ installation
- Creates a dedicated `solr` system user
- Downloads and installs Solr 9.10.0 to `/opt/solr`
- Configures Solr directories (`/var/solr/data`, `/var/solr/logs`)
- Installs and enables the systemd service
- Creates the `movies` core

### 5. **Python Dependencies**
Installs Python packages from `requirements.txt` in a virtual environment.

### 6. **Data Indexing**
- Waits for Solr to be ready (health check)
- Runs `python index_data.py` to index all movie locations
- Verifies indexing by checking document count
- Fails deployment if indexing errors occur

### 7. **Application Restart**
Restarts the Flask application systemd service (`heritage`).

## Solr Configuration

### Core Name
`movies`

### Port
`8983` (localhost only, not publicly accessible)

### Data Location
`/var/solr/data/movies/`

### Logs
`/var/solr/logs/`

## Environment Variables

### `SOLR_URL` (Optional)
Override the default Solr URL for custom configurations.

**Default:** `http://localhost:8983/solr/movies`

**Usage:**
```bash
export SOLR_URL="http://custom-host:8983/solr/movies"
python index_data.py
```

## Systemd Services

### `solr.service`
Manages the Solr server process.

**Commands:**
```bash
sudo systemctl start solr      # Start Solr
sudo systemctl stop solr       # Stop Solr
sudo systemctl restart solr    # Restart Solr
sudo systemctl status solr     # Check status
sudo journalctl -u solr -f     # View logs
```

### `movie.service`
Manages the Flask application.

## Deployment Secrets

The workflow requires these GitHub secrets:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | VPS hostname or IP address |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_PASSWORD` | SSH password |
| `DEPLOY_PATH` | Deployment directory path (e.g., `/opt/heritage-sites-finder`) |
| `DEPLOY_PORT` | SSH port (optional, defaults to 22) |

## VPS Requirements

### Operating System
Ubuntu 20.04+ or Debian 11+

### Software
- **Java**: OpenJDK 11 or higher
  ```bash
  sudo apt update
  sudo apt install -y openjdk-17-jdk
  ```
- **Python**: 3.8+
- **curl**: For health checks
- **systemd**: For service management

### Disk Space
- Solr installation: ~500 MB
- Indexed data: Varies (depends on `movie_locations.json` size)
- Logs: ~100 MB (rotated automatically)

### Permissions
The deployment user must have:
- `sudo` access for installing Solr and managing services
- Write access to `/opt/solr` and `/var/solr`

## Monitoring and Maintenance

### Check Solr Status
```bash
curl http://localhost:8983/solr/admin/cores?action=STATUS
```

### Check Indexed Document Count
```bash
curl "http://localhost:8983/solr/movies/select?q=*:*&rows=0"
```

### Re-index Data Manually
```bash
cd /opt/heritage-sites-finder  # or your DEPLOY_PATH
source .venv/bin/activate
python index_data.py
```

### View Application Logs
```bash
sudo journalctl -u heritage -f
```

## Troubleshooting

### Deployment Fails at Solr Setup
**Symptom:** Workflow fails with "Java is not installed"

**Solution:**
```bash
ssh user@vps
sudo apt update
sudo apt install -y openjdk-17-jdk
```

### Solr Not Responding
**Symptom:** "ERROR: Solr is not responding after 30 seconds"

**Solution:**
```bash
sudo systemctl status solr
sudo journalctl -u solr -n 100
sudo systemctl restart solr
```

### No Documents Indexed
**Symptom:** "WARNING: No documents were indexed!"

**Possible causes:**
1. `movie_locations.json` is missing or empty
2. Solr core doesn't exist
3. Permission issues

**Solution:**
```bash
# Check if file exists
ls -lh /opt/heritage-sites-finder/movie_locations.json

# Verify core exists
curl "http://localhost:8983/solr/admin/cores?action=STATUS&core=movies"

# Re-run indexing with verbose output
cd /opt/heritage-sites-finder
source .venv/bin/activate
python index_data.py
```

### Search Not Working in Application
**Symptom:** API returns empty results

**Solution:**
1. Check Solr is running: `sudo systemctl status solr`
2. Verify Flask can reach Solr: `curl http://localhost:8983/solr/movies/select?q=test`
3. Check application logs: `sudo journalctl -u heritage -n 50`
4. Restart application: `sudo systemctl restart heritage`

## Manual Solr Setup (Alternative)

If you prefer to set up Solr manually instead of using the automated workflow:

1. SSH into your VPS
2. Run the setup script:
   ```bash
   cd /opt/heritage-sites-finder/deployment
   sudo bash setup_solr_vps.sh
   ```
3. Comment out the Solr setup section in `.github/workflows/deploy.yml` (lines 85-95)

This approach is useful for:
- Testing Solr configuration before automating
- Custom Solr configurations
- Troubleshooting deployment issues

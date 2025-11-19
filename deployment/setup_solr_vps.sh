#!/bin/bash
set -euo pipefail

# Solr VPS Setup Script
# This script installs and configures Apache Solr on a VPS server
# It is idempotent and can be run multiple times safely

SOLR_VERSION="9.10.0"
SOLR_DIR="/opt/solr"
SOLR_USER="solr"
SOLR_CORE="movies"
SOLR_PORT="8983"

echo "========================================="
echo "Apache Solr Setup Script"
echo "Version: $SOLR_VERSION"
echo "Core: $SOLR_CORE"
echo "========================================="

# 1. Check if Java is installed
echo "[1/8] Checking Java installation..."
if ! command -v java &> /dev/null; then
    echo "ERROR: Java is not installed. Please install Java 11+ first."
    echo "Run: sudo apt update && sudo apt install -y openjdk-17-jdk"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    echo "ERROR: Java version must be 11 or higher. Found: $JAVA_VERSION"
    exit 1
fi
echo "✓ Java $JAVA_VERSION detected"

# 2. Create solr user if it doesn't exist
echo "[2/8] Creating solr user..."
if ! id "$SOLR_USER" &>/dev/null; then
    sudo useradd -r -s /bin/bash -d /opt/solr -m "$SOLR_USER"
    echo "✓ Created user: $SOLR_USER"
else
    echo "✓ User $SOLR_USER already exists"
fi

# 3. Download Solr if not already present
echo "[3/8] Checking Solr installation..."
SOLR_ARCHIVE="solr-$SOLR_VERSION.tgz"
SOLR_URL="https://archive.apache.org/dist/solr/solr/$SOLR_VERSION/$SOLR_ARCHIVE"

# Check if Solr is properly installed by verifying the binary exists
if [ ! -f "$SOLR_DIR/bin/solr" ]; then
    echo "Downloading Solr $SOLR_VERSION..."
    cd /tmp
    if [ ! -f "$SOLR_ARCHIVE" ]; then
        wget -q --show-progress "$SOLR_URL" || {
            echo "ERROR: Failed to download Solr from $SOLR_URL"
            exit 1
        }
    fi
    
    echo "Extracting Solr..."
    sudo mkdir -p "$SOLR_DIR"
    sudo tar xzf "$SOLR_ARCHIVE" -C "$SOLR_DIR" --strip-components=1
    sudo chown -R "$SOLR_USER:$SOLR_USER" "$SOLR_DIR"
    rm -f "$SOLR_ARCHIVE"
    echo "✓ Solr installed to $SOLR_DIR"
else
    echo "✓ Solr already installed at $SOLR_DIR"
fi

# 4. Set up Solr directories and permissions
echo "[4/8] Setting up directories and permissions..."
sudo mkdir -p /var/solr/data
sudo mkdir -p /var/solr/logs
sudo chown -R "$SOLR_USER:$SOLR_USER" /var/solr
sudo chown -R "$SOLR_USER:$SOLR_USER" "$SOLR_DIR"
echo "✓ Directories configured"

# 5. Configure Solr environment
echo "[5/8] Configuring Solr environment..."
SOLR_ENV="$SOLR_DIR/bin/solr.in.sh"
if [ ! -f "$SOLR_ENV" ]; then
    sudo tee "$SOLR_ENV" > /dev/null <<EOF
SOLR_PID_DIR="/var/solr"
SOLR_HOME="/var/solr/data"
LOG4J_PROPS="/var/solr/log4j2.xml"
SOLR_LOGS_DIR="/var/solr/logs"
SOLR_PORT="$SOLR_PORT"
EOF
    sudo chown "$SOLR_USER:$SOLR_USER" "$SOLR_ENV"
    echo "✓ Created Solr environment configuration"
else
    echo "✓ Solr environment already configured"
fi

# 6. Install systemd service
echo "[6/8] Installing systemd service..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/solr.service" ]; then
    sudo cp "$SCRIPT_DIR/solr.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable solr
    echo "✓ Systemd service installed and enabled"
else
    echo "⚠ Warning: solr.service file not found in $SCRIPT_DIR"
fi

# 7. Start Solr
echo "[7/8] Starting Solr..."
if sudo systemctl is-active --quiet solr; then
    echo "Solr is already running, restarting..."
    sudo systemctl restart solr
else
    sudo systemctl start solr
fi

# Wait for Solr to be ready
echo "Waiting for Solr to start..."
for i in {1..30}; do
    if curl -s "http://localhost:$SOLR_PORT/solr/admin/cores?action=STATUS" > /dev/null 2>&1; then
        echo "✓ Solr is running on port $SOLR_PORT"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Solr failed to start within 30 seconds"
        sudo journalctl -u solr -n 50
        exit 1
    fi
    sleep 1
done

# 8. Create core if it doesn't exist
echo "[8/8] Creating Solr core '$SOLR_CORE'..."
CORE_EXISTS=$(curl -s "http://localhost:$SOLR_PORT/solr/admin/cores?action=STATUS&core=$SOLR_CORE" | grep -c "\"name\":\"$SOLR_CORE\"" || true)

if [ "$CORE_EXISTS" -eq 0 ]; then
    echo "Creating core '$SOLR_CORE'..."
    sudo -u "$SOLR_USER" "$SOLR_DIR/bin/solr" create -c "$SOLR_CORE" || {
        echo "ERROR: Failed to create core '$SOLR_CORE'"
        exit 1
    }
    echo "✓ Core '$SOLR_CORE' created successfully"
else
    echo "✓ Core '$SOLR_CORE' already exists"
fi

echo ""
echo "========================================="
echo "✓ Solr setup completed successfully!"
echo "========================================="
echo "Solr Admin UI: http://localhost:$SOLR_PORT/solr/"
echo "Core: $SOLR_CORE"
echo "Status: sudo systemctl status solr"
echo "Logs: sudo journalctl -u solr -f"
echo "========================================="

#!/bin/bash
set -euo pipefail

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

# 1. Check Java
echo "[1/8] Checking Java..."
if ! command -v java &>/dev/null; then
    echo "ERROR: Java not found. Install Java 11+ first."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
    echo "ERROR: Java version $JAVA_VERSION is less than 11"
    exit 1
fi
echo "✓ Java $JAVA_VERSION detected"

# 2. Create solr user if missing
echo "[2/8] Creating solr user..."
if ! id "$SOLR_USER" &>/dev/null; then
    sudo useradd -r -s /bin/bash -d "$SOLR_DIR" -m "$SOLR_USER"
    echo "✓ Created user $SOLR_USER"
else
    echo "✓ User $SOLR_USER exists"
fi

# 3. Install Solr if missing
echo "[3/8] Checking Solr installation..."
if [ ! -f "$SOLR_DIR/bin/solr" ]; then
    SOLR_ARCHIVE="solr-$SOLR_VERSION.tgz"
    SOLR_URL="https://archive.apache.org/dist/solr/solr/$SOLR_VERSION/$SOLR_ARCHIVE"
    cd /tmp
    wget -q --show-progress "$SOLR_URL"
    sudo mkdir -p "$SOLR_DIR"
    sudo tar xzf "$SOLR_ARCHIVE" -C "$SOLR_DIR" --strip-components=1
    sudo chown -R "$SOLR_USER:$SOLR_USER" "$SOLR_DIR"
    rm -f "$SOLR_ARCHIVE"
    echo "✓ Solr installed"
else
    echo "✓ Solr already installed"
fi

# 4. Setup Solr directories
echo "[4/8] Creating directories..."
sudo mkdir -p /var/solr/data
sudo mkdir -p /var/solr/logs
sudo chown -R "$SOLR_USER:$SOLR_USER" /var/solr
echo "✓ Directories ready"

# 5. Configure Solr environment
echo "[5/8] Configuring solr.in.sh..."
SOLR_ENV="$SOLR_DIR/bin/solr.in.sh"
if [ ! -f "$SOLR_ENV" ]; then
    sudo tee "$SOLR_ENV" > /dev/null <<EOF
SOLR_PID_DIR="/var/solr"
SOLR_HOME="/var/solr/data"
SOLR_LOGS_DIR="/var/solr/logs"
SOLR_PORT="$SOLR_PORT"
EOF
    sudo chown "$SOLR_USER:$SOLR_USER" "$SOLR_ENV"
    echo "✓ solr.in.sh created"
else
    echo "✓ solr.in.sh already exists"
fi

# 6. Install systemd service
echo "[6/8] Installing systemd service..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/solr.service" ]; then
    sudo cp "$SCRIPT_DIR/solr.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable solr
    echo "✓ Systemd service installed"
else
    echo "⚠ Warning: solr.service not found"
fi

# 7. Start Solr
echo "[7/8] Starting Solr..."
if sudo systemctl is-active --quiet solr; then
    sudo systemctl restart solr
else
    sudo systemctl start solr
fi

# Wait for Solr to be ready
echo "Waiting for Solr..."
for i in {1..30}; do
    if curl -s "http://localhost:$SOLR_PORT/solr/admin/cores?action=STATUS" > /dev/null 2>&1; then
        echo "✓ Solr running on port $SOLR_PORT"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Solr failed to start"
        sudo journalctl -u solr -n 50
        exit 1
    fi
    sleep 1
done

# 8. Create core using configset
echo "[8/8] Creating Solr core '$SOLR_CORE' from configsets/movies..."

CONFIGSET_PATH="$SCRIPT_DIR/../configsets/movies"

if curl -s "http://localhost:$SOLR_PORT/solr/admin/cores?action=STATUS&core=$SOLR_CORE" | grep -q "\"name\":\"$SOLR_CORE\""; then
    echo "✓ Core '$SOLR_CORE' already exists"
else
    sudo -u "$SOLR_USER" "$SOLR_DIR/bin/solr" create -c "$SOLR_CORE" -d "$CONFIGSET_PATH" -p "$SOLR_PORT"
    echo "✓ Core '$SOLR_CORE' created using configset at $CONFIGSET_PATH"
fi

echo ""
echo "========================================="
echo "✓ Solr setup completed successfully!"
echo "Solr Admin UI: http://localhost:$SOLR_PORT/solr/"
echo "Core: $SOLR_CORE"
echo "Logs: sudo journalctl -u solr -f"
echo "========================================="

#!/bin/bash
set -euo pipefail

# Solr VPS Setup Script
# Solr 9.x + clustering (module-based)
# Uses ONLY variables defined here

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
echo "[1/8] Checking Java installation..."
if ! command -v java &>/dev/null; then
  echo "ERROR: Java is not installed"
  exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ]; then
  echo "ERROR: Java 11+ required"
  exit 1
fi
echo "✓ Java $JAVA_VERSION detected"

# 2. solr user
echo "[2/8] Creating solr user..."
if ! id "$SOLR_USER" &>/dev/null; then
  sudo useradd -r -s /bin/false -d "$SOLR_DIR" "$SOLR_USER"
  echo "✓ User created"
else
  echo "✓ User exists"
fi

# 3. Install Solr
echo "[3/8] Checking Solr installation..."
SOLR_ARCHIVE="solr-$SOLR_VERSION.tgz"
SOLR_URL="https://archive.apache.org/dist/solr/solr/$SOLR_VERSION/$SOLR_ARCHIVE"

if [ ! -x "$SOLR_DIR/bin/solr" ]; then
  cd /tmp
  if [ ! -f "$SOLR_ARCHIVE" ]; then
    wget -q --show-progress "$SOLR_URL"
  fi
  sudo mkdir -p "$SOLR_DIR"
  sudo tar xzf "$SOLR_ARCHIVE" -C "$SOLR_DIR" --strip-components=1
  sudo chown -R "$SOLR_USER:$SOLR_USER" "$SOLR_DIR"
  rm -f "$SOLR_ARCHIVE"
  echo "✓ Solr installed"
else
  echo "✓ Solr already installed"
fi

# 4. Directories
echo "[4/8] Setting up directories..."
sudo mkdir -p /var/solr/data /var/solr/logs
sudo chown -R "$SOLR_USER:$SOLR_USER" /var/solr
sudo chown -R "$SOLR_USER:$SOLR_USER" "$SOLR_DIR"
echo "✓ Directories ready"

# 4b. Copy solrconfig.xml INTO CORE
echo "[4b/8] Installing solrconfig.xml into core..."

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE_CONF_DIR="/var/solr/data/$SOLR_CORE/conf"

sudo mkdir -p "$CORE_CONF_DIR"

if [ -f "$REPO_ROOT/solrconfig.xml" ]; then
  sudo cp "$REPO_ROOT/solrconfig.xml" "$CORE_CONF_DIR/solrconfig.xml"
  sudo chown -R "$SOLR_USER:$SOLR_USER" "$CORE_CONF_DIR"
  echo "✓ solrconfig.xml installed into core"
else
  echo "ERROR: solrconfig.xml not found in $REPO_ROOT"
  exit 1
fi

# 5. Solr environment (ENABLE CLUSTERING MODULE)
echo "[5/8] Configuring Solr environment..."

SOLR_ENV="$SOLR_DIR/bin/solr.in.sh"
sudo tee "$SOLR_ENV" >/dev/null <<EOF
SOLR_PID_DIR="/var/solr"
SOLR_HOME="/var/solr/data"
SOLR_LOGS_DIR="/var/solr/logs"
SOLR_PORT="$SOLR_PORT"
SOLR_OPTS="\$SOLR_OPTS -Denable.modules=clustering"
EOF

sudo chown "$SOLR_USER:$SOLR_USER" "$SOLR_ENV"
echo "✓ solr.in.sh configured"

# 6. systemd service
echo "[6/8] Installing systemd service..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

sudo tee /etc/systemd/system/solr.service >/dev/null <<EOF
[Unit]
Description=Apache Solr
After=network.target

[Service]
User=$SOLR_USER
Group=$SOLR_USER
ExecStart=$SOLR_DIR/bin/solr start -f
ExecStop=$SOLR_DIR/bin/solr stop
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable solr
echo "✓ systemd installed"

# 7. Start Solr
echo "[7/8] Starting Solr..."
if sudo systemctl is-active --quiet solr; then
  sudo systemctl restart solr
else
  sudo systemctl start solr
fi

echo "Waiting for Solr..."
for i in {1..30}; do
  if curl -s "http://localhost:$SOLR_PORT/solr/admin/info/system" >/dev/null; then
    echo "✓ Solr running"
    break
  fi
  sleep 1
done

# 8. Create core (NO schema.xml)
echo "[8/8] Creating core '$SOLR_CORE'..."

if ! curl -s "http://localhost:$SOLR_PORT/solr/$SOLR_CORE/admin/ping" >/dev/null; then
  sudo -u "$SOLR_USER" "$SOLR_DIR/bin/solr" create \
    -c "$SOLR_CORE" \
    -d "$CORE_CONF_DIR"
  echo "✓ Core created"
else
  echo "✓ Core already exists"
fi

echo "========================================="
echo "✓ Solr deployment COMPLETE"
echo "UI: http://localhost:$SOLR_PORT/solr/"
echo "Core: $SOLR_CORE"
echo "========================================="

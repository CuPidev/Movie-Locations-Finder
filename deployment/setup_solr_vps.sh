#!/bin/bash
set -euo pipefail

SOLR_VERSION="9.10.0"
SOLR_USER="solr"
SOLR_DIR="/opt/solr"
SOLR_PORT="8983"
SOLR_CORE="movies"

CONFIGSET_NAME="movies"
CONFIGSET_DIR="/var/solr/configsets/$CONFIGSET_NAME"

echo "=== Solr $SOLR_VERSION deployment ==="

# 1. Java
if ! command -v java >/dev/null; then
  echo "Install Java 17 first"
  exit 1
fi

# 2. User
if ! id solr &>/dev/null; then
  sudo useradd -r -s /bin/false -d /opt/solr solr
fi

# 3. Install Solr
if [ ! -x "$SOLR_DIR/bin/solr" ]; then
  cd /tmp
  wget -q https://archive.apache.org/dist/solr/solr/$SOLR_VERSION/solr-$SOLR_VERSION.tgz
  sudo tar xzf solr-$SOLR_VERSION.tgz -C /opt
  sudo mv /opt/solr-$SOLR_VERSION /opt/solr
  sudo chown -R solr:solr /opt/solr
fi

# 4. Directories
sudo mkdir -p /var/solr/{data,logs,configsets}
sudo chown -R solr:solr /var/solr

# 5. Configset
sudo mkdir -p "$CONFIGSET_DIR/conf"

# Copy configs from repo
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
sudo cp "$REPO_ROOT/solrconfig.xml" "$CONFIGSET_DIR/conf/"
sudo cp "$REPO_ROOT/schema.xml" "$CONFIGSET_DIR/conf/"

sudo chown -R solr:solr "$CONFIGSET_DIR"

# 6. solr.in.sh (enable clustering module)
sudo tee "$SOLR_DIR/bin/solr.in.sh" >/dev/null <<EOF
SOLR_HOME=/var/solr/data
SOLR_LOGS_DIR=/var/solr/logs
SOLR_PORT=$SOLR_PORT
SOLR_OPTS="\$SOLR_OPTS -Denable.modules=clustering"
EOF

sudo chown solr:solr "$SOLR_DIR/bin/solr.in.sh"

# 7. systemd
sudo tee /etc/systemd/system/solr.service >/dev/null <<EOF
[Unit]
Description=Apache Solr
After=network.target

[Service]
User=solr
Group=solr
ExecStart=$SOLR_DIR/bin/solr start -f
ExecStop=$SOLR_DIR/bin/solr stop
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable solr
sudo systemctl restart solr

# 8. Create core
sleep 10

if ! curl -s "http://localhost:$SOLR_PORT/solr/$SOLR_CORE/admin/ping" >/dev/null; then
  sudo -u solr $SOLR_DIR/bin/solr create \
    -c "$SOLR_CORE" \
    -d "$CONFIGSET_DIR"
fi

echo "=== Solr ready ==="
echo "http://localhost:$SOLR_PORT/solr/#/$SOLR_CORE"

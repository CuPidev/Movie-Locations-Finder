FROM solr:9.10.0

# Install Maven for plugin build
RUN apt-get update && apt-get install -y maven wget && rm -rf /var/lib/apt/lists/*

# Download and build clustering plugin from Solr source
RUN wget https://archive.apache.org/dist/solr/solr/9.10.0/solr-9.10.0-src.tgz -O /tmp/solr-9.10.0-src.tgz \
 && tar xzf /tmp/solr-9.10.0-src.tgz -C /tmp \
 && CLUSTERING_DIR=$(find /tmp/solr-9.10.0-src -type d -path '*/modules/clustering' | head -n 1) \
 && cd $CLUSTERING_DIR \
 && mvn package -DskipTests \
 && cp target/*.jar /opt/solr/server/solr-webapp/webapp/WEB-INF/lib/

# Copy configset into image
COPY configsets /opt/solr/server/solr/configsets

# Expose Solr port
EXPOSE 8983

# Entrypoint is default (solr)

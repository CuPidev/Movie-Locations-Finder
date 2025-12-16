FROM solr:9.10.0

USER root
# Install Maven for plugin build (optional, can be removed if not building plugins)
RUN apt-get update && apt-get install -y maven wget && rm -rf /var/lib/apt/lists/*

USER solr
# Download and extract Solr 9.10.0 tarball, copy clustering JARs
RUN wget https://archive.apache.org/dist/solr/solr/9.10.0/solr-9.10.0.tgz -O /tmp/solr-9.10.0.tgz \
 && tar xzf /tmp/solr-9.10.0.tgz -C /tmp \
 && cp /tmp/solr-9.10.0/modules/clustering/lib/*.jar /opt/solr/server/solr-webapp/webapp/WEB-INF/lib/

# Copy configset into image
COPY configsets /opt/solr/server/solr/configsets

# Expose Solr port
EXPOSE 8983

# Entrypoint is default (solr)

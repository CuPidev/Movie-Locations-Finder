FROM solr:latest

# Switch to root to write into image filesystem, then return to solr user
USER root

# Create a configset directory and copy the repo solrconfig.xml into it
RUN mkdir -p /opt/solr/server/solr/configsets/movies/conf
COPY solrconfig.xml /opt/solr/server/solr/configsets/movies/conf/solrconfig.xml
RUN chown -R solr:solr /opt/solr/server/solr/configsets/movies

# Restore non-root user
USER solr

# Precreate the core using the baked configset name
CMD ["solr-precreate", "movies", "movies"]

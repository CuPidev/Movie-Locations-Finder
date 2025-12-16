FROM solr:latest

# Bake repository solrconfig.xml into a configset and precreate the 'movies' core
RUN mkdir -p /opt/solr/server/solr/configsets/movies/conf
COPY solrconfig.xml /opt/solr/server/solr/configsets/movies/conf/solrconfig.xml

# If you have additional conf files, add them to the repo root or deployment/solr_conf
# and add COPY lines here.

CMD ["solr-precreate", "movies", "/opt/solr/server/solr/configsets/movies"]

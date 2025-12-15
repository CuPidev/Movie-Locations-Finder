import pysolr


class Indexer:
    def __init__(self, solr_url="http://localhost:8983/solr/movies"):
        self.solr = pysolr.Solr(solr_url, always_commit=True)

    def add_document(self, doc_id: str, content: str, **kwargs):
        doc = {
            "id": doc_id,
            "content": content,
        }
        doc.update(kwargs)
        self.solr.add([doc])

    def add_documents(self, docs: list):
        """
        Add a list of documents to Solr.
        Each doc should be a dictionary.
        """
        self.solr.add(docs)

    def delete_all(self):
        """
        Delete all documents from the Solr index.
        """
        self.solr.delete(q="*:*")

    def search(self, query: str, clustering: bool = False, **kwargs):
        # Search across title and content fields
        # Use Solr's query syntax to search multiple fields
        solr_query = f"title:({query}) OR content:({query})"
        params = kwargs.copy()
        if clustering:
            params["clustering"] = "true"
        
        return self.solr.search(solr_query, **params)

    def browse(
        self,
        query: str = None,
        offset: int = 0,
        limit: int = 10,
        shuffle: bool = False,
        **kwargs,
    ):
        """Browse documents with pagination and optional shuffle.

        Returns a Solr results object.
        """
        if query:
            solr_query = f"title:({query}) OR content:({query})"
        else:
            solr_query = "*:*"

        params = kwargs.copy()
        params.setdefault("start", offset)
        params.setdefault("rows", limit)

        if shuffle:
            # Simple shuffle using a random seed; Solr supports random_<seed>
            import random

            seed = random.randint(1, 1000000)
            params.setdefault("sort", f"random_{seed} asc")
        else:
            # Default sort by score desc when available
            params.setdefault("sort", "score desc")

        return self.solr.search(solr_query, **params)

    def more_like_this(self, doc_id: str, mlt_fields: list = None, count: int = 10, **kwargs):
        """Find similar documents using Solr's Standard Request Handler with mlt=true."""
        if mlt_fields is None:
            mlt_fields = ["title", "content"]

        params = {
            "mlt": "true",
            "mlt.fl": ",".join(mlt_fields),
            "mlt.mindf": 1,
            "mlt.mintf": 1,
            "mlt.count": count,
            "mlt.boost": "true",  # Boost results by term frequency
            "mlt.qf": "title^3 content^1",  # Boost title matches 3x more than content
            "rows": 1,
            "fl": "*, score",  # Include score in results
        }
        params.update(kwargs)

        results = self.solr.search(f'id:"{doc_id}"', **params)
        
        # pysolr stores moreLikeThis in raw_response, not as a direct attribute
        mlt_response = results.raw_response.get("moreLikeThis", {})
        mlt_data = mlt_response.get(doc_id, {})
        
        # Handle both formats: direct list or dict with 'docs' key
        if isinstance(mlt_data, dict):
            return mlt_data.get("docs", [])
        return mlt_data

    def group_by_location(self, query: str = None, limit: int = 10, group_limit: int = 5, **kwargs):
        """Search with results grouped by location_name.
        
        Returns results grouped by location, showing multiple movies per location.
        """
        if query:
            solr_query = f"title:({query}) OR content:({query}) OR location_name:({query})"
        else:
            solr_query = "*:*"
        
        params = {
            "group": "true",
            "group.field": "location_name",
            "group.limit": group_limit,  # Max docs per group
            "group.ngroups": "true",  # Return total number of groups
            "rows": limit,  # Number of groups to return
        }
        params.update(kwargs)
        
        results = self.solr.search(solr_query, **params)
        return results

    def nearby_locations(self, lat: float, lon: float, radius_km: float = 50, limit: int = 20, **kwargs):
        """Find filming locations within a radius of a point.
        
        Uses Solr's spatial search with geodist() function.
        """
        # Only query documents that have location coordinates
        params = {
            "fq": f"{{!geofilt sfield=location_pt pt={lat},{lon} d={radius_km}}}",
            "sort": f"geodist(location_pt,{lat},{lon}) asc",  # Sort by distance
            "fl": f"*, _dist_:geodist(location_pt,{lat},{lon})",  # Include distance in results
            "rows": limit,
        }
        params.update(kwargs)
        
        results = self.solr.search("location_pt:*", **params)
        return results


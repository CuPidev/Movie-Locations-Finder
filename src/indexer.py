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

    def search(self, query: str, **kwargs):
        # Search across title and content fields
        # Use Solr's query syntax to search multiple fields
        solr_query = f"title:({query}) OR content:({query})"
        return self.solr.search(solr_query, **kwargs)

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

    def more_like_this(self, doc_id: str, mlt_fields: list = None, **kwargs):
        """Find similar documents using Solr's Standard Request Handler with mlt=true."""
        if mlt_fields is None:
            mlt_fields = ["title", "content"]

        query = f'id:"{doc_id}"'

        params = kwargs.copy()
        params["mlt"] = "true"
        params["mlt.fl"] = ",".join(mlt_fields)
        params.setdefault("mlt.mindf", 1)
        params.setdefault("mlt.mintf", 1)
        # Set rows to 1 to ensure we find the source doc (required for MLT usually)
        params.setdefault("rows", 1)

        results = self.solr.search(query, **params)
        
        # results.moreLikeThis is a dict: { doc_id: [ ... similar docs ... ] }
        if hasattr(results, 'moreLikeThis') and doc_id in results.moreLikeThis:
             return results.moreLikeThis[doc_id]
        # In case the ID in response doesn't match exactly or something
        if hasattr(results, 'moreLikeThis'):
            # Return the first list found if any
            for key in results.moreLikeThis:
                return results.moreLikeThis[key]
                
        return []

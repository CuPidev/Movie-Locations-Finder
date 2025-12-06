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

        params = {
            "mlt": "true",
            "mlt.fl": ",".join(mlt_fields),
            "mlt.mindf": 1,
            "mlt.mintf": 1,
            "rows": 1,
        }
        params.update(kwargs)

        results = self.solr.search(f'id:"{doc_id}"', **params)
        return getattr(results, "moreLikeThis", {}).get(doc_id, [])

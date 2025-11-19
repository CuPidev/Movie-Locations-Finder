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
        solr_query = f'title:({query}) OR content:({query})'
        return self.solr.search(solr_query, **kwargs)


"""Simple TF-IDF indexer for heritage site documents."""


class Indexer:
    def __init__(self):
        self.index = {}

    def add_document(self, doc_id: str, content: str):
        self.index[doc_id] = content

    def get_document(self, doc_id: str) -> str:
        return self.index.get(doc_id, "")

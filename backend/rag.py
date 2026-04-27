import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Determine the absolute path to the data file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "traffic_laws.json")

class RAGSystem:
    def __init__(self, data_path=DATA_PATH):
        self.data = self._load_data(data_path)
        self.documents = [
            f"Title: {item['title']}\nContent: {item['content']}\nPenalty: {item['penalty']}"
            for item in self.data
        ]
        
        # Initialize TF-IDF Vectorizer
        self.vectorizer = TfidfVectorizer()
        if self.documents:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.documents)
        else:
            self.tfidf_matrix = None

    def _load_data(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Data file not found at {path}. Returning empty list.")
            return []
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {path}.")
            return []

    def retrieve(self, query: str, top_k: int = 2):
        if self.tfidf_matrix is None or not self.documents:
            return []
        
        # Transform the query using the same vectorizer
        query_vector = self.vectorizer.transform([query])
        
        # Compute cosine similarities between the query and all documents
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        
        # Get the indices of the top-k most similar documents
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            # Only include if there is some level of similarity
            if similarities[idx] > 0.05:
                results.append({
                    "score": float(similarities[idx]),
                    "document": self.data[idx]
                })
        
        return results

# Initialize a global instance for the API to use
rag_system = RAGSystem()

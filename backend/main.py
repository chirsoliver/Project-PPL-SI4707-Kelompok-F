from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from rag import rag_system

app = FastAPI(title="LENTRA AI API", description="API for Legal Traffic AI chatbot.")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma3:4b"

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1. Retrieve relevant legal documents (RAG)
    retrieved_results = rag_system.retrieve(question, top_k=2)
    
    # Format the context
    context_text = ""
    for idx, res in enumerate(retrieved_results):
        doc = res["document"]
        context_text += f"\n[Dokumen {idx+1}] {doc['title']}\nIsi: {doc['content']}\nSanksi: {doc['penalty']}\n"
    
    if not context_text:
        context_text = "Tidak ditemukan referensi hukum yang secara khusus relevan dari database lokal."

    # 2. Construct the prompt for Gemma 3
    prompt = f"""You are LENTRA AI, an Indonesian traffic law assistant.
Answer clearly, simply, and based only on legal context. 
If the context does not contain the answer, say you don't know based on the provided laws. Use Indonesian language.

Context:
{context_text}

Question:
{question}

Answer:"""

    # 3. Send request to Ollama
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            ai_data = response.json()
            ai_response = ai_data.get("response", "")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama service is not running or accessible. Please ensure 'ollama run gemma3:4b' is running locally.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with AI model: {str(e)}")

    # 4. Return AI response and context (for frontend to highlight)
    return {
        "answer": ai_response.strip(),
        "context": [res["document"] for res in retrieved_results]
    }

from flask import Flask, request, jsonify
from flask_cors import CORS
import xgboost as xgb
import pandas as pd
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain_community.llms import Ollama

# --- Initialize the Flask app ---
app = Flask(__name__)
CORS(app) # Allow cross-origin requests

# --- Load XGBoost Model ---
xgb_model = xgb.XGBRegressor()
xgb_model.load_model("vehicle_forecaster.json")
print("✅ Python XGBoost Model loaded successfully!")

# --- Ollama RAG Configuration ---
CHROMA_PATH = "chroma"
PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""
print("✅ Ollama RAG configuration loaded.")

# --- XGBoost Prediction Endpoint ---
@app.route('/api/predict', methods=['POST']) # Added /api/ prefix for consistency
def predict():
    input_data = request.get_json()
    timestamps = pd.to_datetime(input_data['timestamps'])
    
    features = pd.DataFrame(index=timestamps)
    features['hour'] = features.index.hour
    features['day_of_week'] = features.index.dayofweek
    features['day_of_month'] = features.index.day
    features['month'] = features.index.month

    predictions = xgb_model.predict(features)

    response = {
        'predictions': dict(zip(input_data['timestamps'], predictions.tolist()))
    }
    return jsonify(response)

# --- Ollama RAG Query Endpoint ---
# FIXED: The route now matches the frontend's API structure ("/api/rag_query")
@app.route('/api/rag_query', methods=['POST'])
def rag_query():
    data = request.get_json()
    query_text = data.get("query")
    context_data = data.get("context") # Accept context directly

    if not query_text:
        return jsonify({"error": "Query text is missing."}), 400

    if context_data:
        # If context is provided directly, use it
        context_text = context_data
    else:
        # Fallback to searching the DB if no direct context is given
        embedding_function = OllamaEmbeddings(model="nomic-embed-text")
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
        results = db.similarity_search_with_relevance_scores(query_text, k=3)
        if not results or results[0][1] < 0.7:
            return jsonify({"response": "Unable to find matching results in the database."})
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])

    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)

    model = Ollama(model="llava-phi3") 
    response_text = model.invoke(prompt)

    return jsonify({"response": response_text})

# --- Main Execution ---
if __name__ == '__main__':
    print("🚀 Starting Flask server on http://0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001)


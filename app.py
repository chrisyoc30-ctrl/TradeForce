from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://tradeforce:tradeforce123@tradeforce.mongodb.net/tradeforce?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client.tradeforce

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/api/leads', methods=['GET'])
def get_leads():
    leads = list(db.leads.find({}, {"_id": 0}))
    return jsonify(leads), 200

@app.route('/api/leads', methods=['POST'])
def create_lead():
    data = request.json
    result = db.leads.insert_one(data)
    return jsonify({"id": str(result.inserted_id)}), 201

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
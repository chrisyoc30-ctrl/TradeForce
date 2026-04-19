from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# MongoDB connection - using standard URI (not SRV) to avoid DNS issues on Railway
MONGO_URI = os.getenv("MONGO_URI", "mongodb://tradeforce:tradeforce123@tradeforce-shard-00-00.mongodb.net:27017,tradeforce-shard-00-01.mongodb.net:27017,tradeforce-shard-00-02.mongodb.net:27017/tradeforce?ssl=true&replicaSet=atlas-abc123&retryWrites=true&w=majority")

try:
    from pymongo import MongoClient
    client = MongoClient(MONGO_URI)
    db = client.tradeforce
    # Test connection
    client.admin.command('ping')
    print("MongoDB connected successfully")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    db = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "TradeForce Backend"}), 200

@app.route('/api/leads', methods=['GET'])
def get_leads():
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
        leads = list(db.leads.find({}, {"_id": 0}))
        return jsonify(leads), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/leads', methods=['POST'])
def create_lead():
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
        data = request.json
        result = db.leads.insert_one(data)
        return jsonify({"id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
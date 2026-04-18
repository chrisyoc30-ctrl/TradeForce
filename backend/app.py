from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

MONGODB_URL = os.environ.get('MONGODB_URL', 'mongodb+srv://chrisyoc30_db_user:DRnZiyU3fmWlrl9@tradeforce.ts4zvj.mongodb.net/?appName=tradeforce')

@app.route('/health', methods=['GET'])
def health():
    try:
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        return jsonify({'status': 'ok', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/leads', methods=['POST'])
def create_lead():
    try:
        client = MongoClient(MONGODB_URL)
        db = client['tradeforce']
        leads = db['leads']
        
        data = request.json
        result = leads.insert_one(data)
        
        return jsonify({'id': str(result.inserted_id), 'success': True}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leads', methods=['GET'])
def get_leads():
    try:
        client = MongoClient(MONGODB_URL)
        db = client['tradeforce']
        leads = db['leads']
        
        leads_list = []
        for lead in leads.find().limit(100):
            lead['_id'] = str(lead['_id'])
            leads_list.append(lead)
        
        return jsonify(leads_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
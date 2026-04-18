from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

MONGODB_URL = 'mongodb+srv://chrisyoc30_db_user:DRnZiyU3fmWlrl9@tradeforce.ts4zvj.mongodb.net/?appName=tradeforce'

@app.route('/health', methods=['GET'])
def health():
    try:
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        return jsonify({'status': 'ok', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
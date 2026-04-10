"""TradeForce Backend API"""
import os
import sqlite3
import base64
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = 'tradeforce.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if os.path.exists(DB_PATH):
        return
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            trade TEXT,
            postcode TEXT,
            subscription_tier TEXT DEFAULT 'free',
            free_leads_remaining INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE leads (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            service TEXT NOT NULL,
            description TEXT,
            location TEXT,
            score INTEGER,
            claimed_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claimed_by) REFERENCES customers(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE customer_leads (
            id INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            lead_id INTEGER NOT NULL,
            status TEXT DEFAULT 'available',
            claimed_at TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (lead_id) REFERENCES leads(id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

def create_token(customer_id, email):
    payload = f"{customer_id}:{email}:{datetime.utcnow().isoformat()}"
    return base64.b64encode(payload.encode()).decode()

def verify_token(token):
    try:
        payload = base64.b64decode(token).decode()
        parts = payload.split(':')
        if len(parts) >= 3:
            customer_id = int(parts[0])
            email = parts[1]
            timestamp_str = parts[2]
            token_time = datetime.fromisoformat(timestamp_str)
            if datetime.utcnow() - token_time > timedelta(days=30):
                return None
            return {'customer_id': customer_id, 'email': email}
        return None
    except:
        return None

def get_auth_customer():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        return None
    token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else auth_header
    return verify_token(token)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        required = ['email', 'password', 'name', 'phone', 'trade', 'postcode']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        name = data['name'].strip()
        phone = data['phone'].strip()
        trade = data['trade'].strip()
        postcode = data['postcode'].strip().upper()
        
        if '@' not in email or len(email) < 5:
            return jsonify({'error': 'Invalid email'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM customers WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        password_hash = generate_password_hash(password)
        cursor.execute('''
            INSERT INTO customers (email, password_hash, name, phone, trade, postcode, free_leads_remaining)
            VALUES (?, ?, ?, ?, ?, ?, 5)
        ''', (email, password_hash, name, phone, trade, postcode))
        
        conn.commit()
        customer_id = cursor.lastrowid
        token = create_token(customer_id, email)
        conn.close()
        
        return jsonify({
            'status': 'success',
            'customer_id': customer_id,
            'token': token,
            'free_leads': 5
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing email or password'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, password_hash, name FROM customers WHERE email = ?', (email,))
        customer = cursor.fetchone()
        conn.close()
        
        if not customer or not check_password_hash(customer['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        token = create_token(customer['id'], email)
        return jsonify({
            'status': 'success',
            'customer_id': customer['id'],
            'name': customer['name'],
            'token': token
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer/profile', methods=['GET'])
def get_profile():
    try:
        auth = get_auth_customer()
        if not auth:
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, name, phone, trade, postcode, subscription_tier, free_leads_remaining
            FROM customers WHERE id = ?
        ''', (auth['customer_id'],))
        
        customer = cursor.fetchone()
        conn.close()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify({
            'id': customer['id'],
            'email': customer['email'],
            'name': customer['name'],
            'phone': customer['phone'],
            'trade': customer['trade'],
            'postcode': customer['postcode'],
            'subscription_tier': customer['subscription_tier'],
            'free_leads_remaining': customer['free_leads_remaining']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer/leads', methods=['GET'])
def get_customer_leads():
    try:
        auth = get_auth_customer()
        if not auth:
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT l.id, l.name, l.email, l.phone, l.service, l.description, l.location, l.score, l.created_at
            FROM leads l
            JOIN customer_leads cl ON l.id = cl.lead_id
            WHERE cl.customer_id = ? AND cl.status = 'available'
            ORDER BY l.score DESC
        ''', (auth['customer_id'],))
        
        leads = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'leads': leads, 'count': len(leads)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer/leads/<int:lead_id>', methods=['GET'])
def get_lead_details(lead_id):
    try:
        auth = get_auth_customer()
        if not auth:
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT l.id, l.name, l.email, l.phone, l.service, l.description, l.location, l.score, l.created_at
            FROM leads l
            JOIN customer_leads cl ON l.id = cl.lead_id
            WHERE l.id = ? AND cl.customer_id = ?
        ''', (lead_id, auth['customer_id']))
        
        lead = cursor.fetchone()
        conn.close()
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
        
        return jsonify(dict(lead)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer/leads/<int:lead_id>/claim', methods=['POST'])
def claim_lead(lead_id):
    try:
        auth = get_auth_customer()
        if not auth:
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT status FROM customer_leads WHERE lead_id = ? AND customer_id = ?
        ''', (lead_id, auth['customer_id']))
        
        cl = cursor.fetchone()
        if not cl or cl['status'] != 'available':
            conn.close()
            return jsonify({'error': 'Lead not available'}), 400
        
        cursor.execute('''
            UPDATE customer_leads SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP
            WHERE lead_id = ? AND customer_id = ?
        ''', (lead_id, auth['customer_id']))
        
        cursor.execute('''
            UPDATE leads SET claimed_by = ? WHERE id = ?
        ''', (auth['customer_id'], lead_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'lead_id': lead_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit-lead', methods=['POST'])
def submit_lead():
    try:
        data = request.get_json()
        required = ['name', 'email', 'phone', 'service', 'location']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO leads (name, email, phone, service, description, location)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data['email'],
            data['phone'],
            data['service'],
            data.get('description', ''),
            data['location']
        ))
        
        lead_id = cursor.lastrowid
        cursor.execute('''
            SELECT id FROM customers WHERE trade = ? AND free_leads_remaining > 0
        ''', (data['service'],))
        
        customers = cursor.fetchall()
        for customer in customers:
            cursor.execute('''
                INSERT INTO customer_leads (customer_id, lead_id, status)
                VALUES (?, ?, 'available')
            ''', (customer['id'], lead_id))
            
            cursor.execute('''
                UPDATE customers SET free_leads_remaining = free_leads_remaining - 1
                WHERE id = ?
            ''', (customer['id'],))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'lead_id': lead_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-leads', methods=['GET'])
def get_leads():
    try:
        api_key = request.headers.get('X-API-Key')
        if api_key != 'change-me-in-production':
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM leads ORDER BY created_at DESC')
        leads = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'leads': leads}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/score-lead/<int:lead_id>', methods=['POST'])
def score_lead(lead_id):
    try:
        api_key = request.headers.get('X-API-Key')
        if api_key != 'change-me-in-production':
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT description, location FROM leads WHERE id = ?', (lead_id,))
        lead = cursor.fetchone()
        
        if not lead:
            conn.close()
            return jsonify({'error': 'Lead not found'}), 404
        
        score = 50
        desc = (lead['description'] or '').lower()
        
        if 'urgent' in desc or 'asap' in desc:
            score += 20
        if 'budget' in desc:
            score += 10
        if len(desc) > 100:
            score += 10
        
        score = min(100, score)
        cursor.execute('UPDATE leads SET score = ? WHERE id = ?', (score, lead_id))
        conn.commit()
        conn.close()
        
        return jsonify({'lead_id': lead_id, 'score': score}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/score-all-leads', methods=['POST'])
def score_all_leads():
    try:
        api_key = request.headers.get('X-API-Key')
        if api_key != 'change-me-in-production':
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM leads WHERE score IS NULL')
        leads = cursor.fetchall()
        
        for lead in leads:
            cursor.execute('SELECT description FROM leads WHERE id = ?', (lead['id'],))
            lead_data = cursor.fetchone()
            
            score = 50
            desc = (lead_data['description'] or '').lower()
            
            if 'urgent' in desc or 'asap' in desc:
                score += 20
            if 'budget' in desc:
                score += 10
            if len(desc) > 100:
                score += 10
            
            score = min(100, score)
            cursor.execute('UPDATE leads SET score = ? WHERE id = ?', (score, lead['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'scored': len(leads)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error'}), 500

# Gunicorn will start the app automatically - no if __name__ block needed
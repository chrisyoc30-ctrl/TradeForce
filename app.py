"""TradeForce Backend API - SQLite Version"""
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
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    if os.path.exists(DB_PATH):
        return
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Create customers table
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
    
    # Create leads table
    cursor.execute('''
        CREATE TABLE leads (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            description TEXT,
            location TEXT,
            trade TEXT,
            postcode TEXT,
            score INTEGER,
            claimed_by INTEGER,
            claimed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claimed_by) REFERENCES customers(id)
        )
    ''')
    
    # Create transactions table
    cursor.execute('''
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            lead_id INTEGER,
            amount DECIMAL(10, 2),
            transaction_type TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (lead_id) REFERENCES leads(id)
        )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✓ Database initialized")

def create_token(customer_id, email):
    """Create authentication token"""
    timestamp = datetime.utcnow().isoformat()
    token_data = f"{customer_id}:{email}:{timestamp}"
    token = base64.b64encode(token_data.encode()).decode()
    return token

def verify_token(token):
    """Verify authentication token"""
    try:
        decoded = base64.b64decode(token).decode()
        parts = decoded.split(':')
        if len(parts) != 3:
            return None
        customer_id, email, timestamp = parts
        return int(customer_id), email
    except:
        return None

# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

# ==================== AUTHENTICATION ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User signup"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        phone = data.get('phone')
        trade = data.get('trade')
        postcode = data.get('postcode')
        
        if not all([email, password, name]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        password_hash = generate_password_hash(password)
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO customers (email, password_hash, name, phone, trade, postcode)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (email, password_hash, name, phone, trade, postcode))
            
            customer_id = cursor.lastrowid
            conn.commit()
            
            token = create_token(customer_id, email)
            
            return jsonify({
                'status': 'success',
                'customer_id': customer_id,
                'token': token,
                'free_leads': 5
            }), 201
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Email already exists'}), 409
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, password_hash, free_leads_remaining FROM customers WHERE email = ?', (email,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        customer_id, password_hash, free_leads = result
        
        if not check_password_hash(password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        token = create_token(customer_id, email)
        
        return jsonify({
            'status': 'success',
            'customer_id': customer_id,
            'token': token,
            'free_leads': free_leads
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CUSTOMER ENDPOINTS ====================

@app.route('/api/customer/profile', methods=['GET'])
def get_profile():
    """Get customer profile"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        token_data = verify_token(token)
        
        if not token_data:
            return jsonify({'error': 'Unauthorized'}), 401
        
        customer_id, email = token_data
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, name, phone, trade, postcode, subscription_tier, free_leads_remaining
            FROM customers WHERE id = ?
        ''', (customer_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Customer not found'}), 404
        
        customer = {
            'id': result['id'],
            'email': result['email'],
            'name': result['name'],
            'phone': result['phone'],
            'trade': result['trade'],
            'postcode': result['postcode'],
            'subscription_tier': result['subscription_tier'],
            'free_leads_remaining': result['free_leads_remaining']
        }
        
        return jsonify(customer), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer/leads', methods=['GET'])
def get_customer_leads():
    """Get leads available to customer"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        token_data = verify_token(token)
        
        if not token_data:
            return jsonify({'error': 'Unauthorized'}), 401
        
        customer_id, email = token_data
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, email, phone, description, location, trade, postcode, score, claimed_by
            FROM leads WHERE claimed_by IS NULL ORDER BY score DESC LIMIT 20
        ''')
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        leads = []
        for row in results:
            leads.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'phone': row['phone'],
                'description': row['description'],
                'location': row['location'],
                'trade': row['trade'],
                'postcode': row['postcode'],
                'score': row['score'],
                'claimed_by': row['claimed_by']
            })
        
        return jsonify({'leads': leads}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer/leads/<int:lead_id>/claim', methods=['POST'])
def claim_lead(lead_id):
    """Claim a lead"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        token_data = verify_token(token)
        
        if not token_data:
            return jsonify({'error': 'Unauthorized'}), 401
        
        customer_id, email = token_data
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if lead exists and is unclaimed
        cursor.execute('SELECT id, claimed_by FROM leads WHERE id = ?', (lead_id,))
        lead = cursor.fetchone()
        
        if not lead:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lead not found'}), 404
        
        if lead['claimed_by'] is not None:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lead already claimed'}), 409
        
        # Claim the lead
        cursor.execute('''
            UPDATE leads SET claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (customer_id, lead_id))
        
        # Deduct free lead
        cursor.execute('''
            UPDATE customers SET free_leads_remaining = free_leads_remaining - 1
            WHERE id = ?
        ''', (customer_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'status': 'success', 'lead_id': lead_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== LEAD SUBMISSION ====================

@app.route('/api/submit-lead', methods=['POST'])
def submit_lead():
    """Submit a new lead"""
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        description = data.get('description')
        location = data.get('location')
        trade = data.get('trade')
        postcode = data.get('postcode')
        
        if not all([name, email, description, trade]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO leads (name, email, phone, description, location, trade, postcode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, email, phone, description, location, trade, postcode))
        
        lead_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'status': 'success', 'lead_id': lead_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ADMIN ENDPOINTS ====================

@app.route('/api/leads/score-all', methods=['POST'])
def score_all_leads():
    """Score all unscored leads"""
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
        cursor.close()
        conn.close()
        
        return jsonify({'status': 'success', 'scored': len(leads)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/leads', methods=['GET'])
def get_all_leads():
    """Get all leads (admin)"""
    try:
        api_key = request.headers.get('X-API-Key')
        if api_key != 'change-me-in-production':
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, email, phone, description, location, trade, postcode, score, claimed_by
            FROM leads ORDER BY created_at DESC
        ''')
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        leads = []
        for row in results:
            leads.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'phone': row['phone'],
                'description': row['description'],
                'location': row['location'],
                'trade': row['trade'],
                'postcode': row['postcode'],
                'score': row['score'],
                'claimed_by': row['claimed_by']
            })
        
        return jsonify({'leads': leads}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error'}), 500

# Initialize database on startup
init_db()

# Gunicorn will start the app automatically

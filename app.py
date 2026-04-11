"""TradeForce Backend API - PostgreSQL Version"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import base64
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# PostgreSQL connection
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    """Get database connection"""
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Create customers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
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
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
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
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
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
        print("✓ Database tables initialized")
    except Exception as e:
        print(f"✗ Database initialization error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

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
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, free_leads_remaining
            ''', (email, password_hash, name, phone, trade, postcode))
            
            result = cursor.fetchone()
            customer_id = result[0]
            free_leads = result[1]
            
            conn.commit()
            
            token = create_token(customer_id, email)
            
            return jsonify({
                'status': 'success',
                'customer_id': customer_id,
                'token': token,
                'free_leads': free_leads
            }), 201
        except psycopg2.IntegrityError:
            conn.rollback()
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
        
        cursor.execute('SELECT id, password_hash, free_leads_remaining FROM customers WHERE email = %s', (email,))
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
            FROM customers WHERE id = %s
        ''', (customer_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Customer not found'}), 404
        
        customer = {
            'id': result[0],
            'email': result[1],
            'name': result[2],
            'phone': result[3],
            'trade': result[4],
            'postcode': result[5],
            'subscription_tier': result[6],
            'free_leads_remaining': result[7]
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
                'id': row[0],
                'name': row[1],
                'email': row[2],
                'phone': row[3],
                'description': row[4],
                'location': row[5],
                'trade': row[6],
                'postcode': row[7],
                'score': row[8],
                'claimed_by': row[9]
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
        cursor.execute('SELECT id, claimed_by FROM leads WHERE id = %s', (lead_id,))
        lead = cursor.fetchone()
        
        if not lead:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lead not found'}), 404
        
        if lead[1] is not None:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lead already claimed'}), 409
        
        # Claim the lead
        cursor.execute('''
            UPDATE leads SET claimed_by = %s, claimed_at = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', (customer_id, lead_id))
        
        # Deduct free lead
        cursor.execute('''
            UPDATE customers SET free_leads_remaining = free_leads_remaining - 1
            WHERE id = %s
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
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (name, email, phone, description, location, trade, postcode))
        
        lead_id = cursor.fetchone()[0]
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
            cursor.execute('SELECT description FROM leads WHERE id = %s', (lead[0],))
            lead_data = cursor.fetchone()
            
            score = 50
            desc = (lead_data[0] or '').lower()
            
            if 'urgent' in desc or 'asap' in desc:
                score += 20
            if 'budget' in desc:
                score += 10
            if len(desc) > 100:
                score += 10
            
            score = min(100, score)
            cursor.execute('UPDATE leads SET score = %s WHERE id = %s', (score, lead[0]))
        
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
                'id': row[0],
                'name': row[1],
                'email': row[2],
                'phone': row[3],
                'description': row[4],
                'location': row[5],
                'trade': row[6],
                'postcode': row[7],
                'score': row[8],
                'claimed_by': row[9]
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
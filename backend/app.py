import os
import json
import sqlite3
import hashlib
import base64
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import stripe

app = Flask(__name__, static_folder='frontend', static_url_path='')

# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://tradescoreglasgow-site.onrender.com", "http://localhost:3000", "http://localhost:5000", "https://profound-pixie-4460bc.netlify.app", "https://tradescore.uk"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Token Secret
TOKEN_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')

# Database setup
DATABASE = 'tradeforce.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            trade TEXT NOT NULL,
            postcode TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subscription_tier TEXT DEFAULT 'free',
            free_leads_remaining INTEGER DEFAULT 5,
            stripe_customer_id TEXT
        )
    ''')
    
    # Leads table (homeowner submissions)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            service TEXT NOT NULL,
            description TEXT,
            location TEXT NOT NULL,
            score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            claimed_by INTEGER,
            claimed_at TIMESTAMP,
            FOREIGN KEY(claimed_by) REFERENCES customers(id)
        )
    ''')
    
    # Customer leads assignment table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            lead_id INTEGER NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            claimed_at TIMESTAMP,
            status TEXT DEFAULT 'available',
            FOREIGN KEY(customer_id) REFERENCES customers(id),
            FOREIGN KEY(lead_id) REFERENCES leads(id),
            UNIQUE(customer_id, lead_id)
        )
    ''')
    
    # Subscriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            tier TEXT NOT NULL,
            stripe_subscription_id TEXT,
            status TEXT DEFAULT 'active',
            leads_per_month INTEGER,
            leads_used_this_month INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            renews_at TIMESTAMP,
            FOREIGN KEY(customer_id) REFERENCES customers(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Utility functions
def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify password against hash"""
    return hash_password(password) == password_hash

def create_token(customer_id, email):
    """Create simple base64 token"""
    payload = f"{customer_id}:{email}:{datetime.utcnow().isoformat()}"
    token = base64.b64encode(payload.encode()).decode()
    return token

def verify_token(token):
    """Verify base64 token"""
    try:
        payload = base64.b64decode(token).decode()
        parts = payload.split(':')
        if len(parts) >= 2:
            return {'customer_id': int(parts[0]), 'email': parts[1]}
        return None
    except:
        return None

def token_required(f):
    """Decorator to require token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
        
        # Remove "Bearer " prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.customer_id = payload['customer_id']
        request.customer_email = payload['email']
        return f(*args, **kwargs)
    
    return decorated

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new tradesperson"""
    data = request.json
    
    # Validate input
    required_fields = ['email', 'password', 'name', 'phone', 'trade', 'postcode']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    phone = data.get('phone')
    trade = data.get('trade')
    postcode = data.get('postcode')
    
    # Validate email format
    if '@' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if email already exists
        cursor.execute('SELECT id FROM customers WHERE email = ?', (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create customer
        cursor.execute('''
            INSERT INTO customers (email, password_hash, name, phone, trade, postcode)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, password_hash, name, phone, trade, postcode))
        
        customer_id = cursor.lastrowid
        
        # Assign 5 free leads
        cursor.execute('''
            SELECT id FROM leads 
            WHERE claimed_by IS NULL 
            AND service = ? 
            LIMIT 5
        ''', (trade,))
        
        free_leads = cursor.fetchall()
        for lead in free_leads:
            cursor.execute('''
                INSERT INTO customer_leads (customer_id, lead_id, status)
                VALUES (?, ?, 'available')
            ''', (customer_id, lead['id']))
        
        # Create token
        token = create_token(customer_id, email)
        
        conn.commit()
        
        return jsonify({
            'status': 'success',
            'customer_id': customer_id,
            'token': token,
            'free_leads': len(free_leads)
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a tradesperson"""
    data = request.json
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id, password_hash, name FROM customers WHERE email = ?', (email,))
        customer = cursor.fetchone()
        
        if not customer or not verify_password(password, customer['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create token
        token = create_token(customer['id'], email)
        
        return jsonify({
            'status': 'success',
            'customer_id': customer['id'],
            'name': customer['name'],
            'token': token
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

# ==================== CUSTOMER PORTAL ENDPOINTS ====================

@app.route('/api/customer/profile', methods=['GET'])
@token_required
def get_profile():
    """Get customer profile"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT id, email, name, phone, trade, postcode, subscription_tier, free_leads_remaining
            FROM customers WHERE id = ?
        ''', (request.customer_id,))
        
        customer = cursor.fetchone()
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
    
    finally:
        conn.close()

@app.route('/api/customer/leads', methods=['GET'])
@token_required
def get_customer_leads():
    """Get leads available for customer"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get customer's trade
        cursor.execute('SELECT trade FROM customers WHERE id = ?', (request.customer_id,))
        customer = cursor.fetchone()
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get leads assigned to this customer
        cursor.execute('''
            SELECT l.id, l.name, l.email, l.phone, l.service, l.description, l.location, l.score, l.created_at
            FROM leads l
            JOIN customer_leads cl ON l.id = cl.lead_id
            WHERE cl.customer_id = ? AND cl.status = 'available'
            ORDER BY l.score DESC
        ''', (request.customer_id,))
        
        leads = []
        for row in cursor.fetchall():
            leads.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'phone': row['phone'],
                'service': row['service'],
                'description': row['description'],
                'location': row['location'],
                'score': row['score'],
                'created_at': row['created_at']
            })
        
        return jsonify({'leads': leads, 'count': len(leads)}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/customer/leads/<int:lead_id>', methods=['GET'])
@token_required
def get_lead_details(lead_id):
    """Get details of a specific lead"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verify customer has access to this lead
        cursor.execute('''
            SELECT l.id, l.name, l.email, l.phone, l.service, l.description, l.location, l.score, l.created_at
            FROM leads l
            JOIN customer_leads cl ON l.id = cl.lead_id
            WHERE l.id = ? AND cl.customer_id = ?
        ''', (lead_id, request.customer_id))
        
        lead = cursor.fetchone()
        if not lead:
            return jsonify({'error': 'Lead not found or not assigned to you'}), 404
        
        return jsonify({
            'id': lead['id'],
            'name': lead['name'],
            'email': lead['email'],
            'phone': lead['phone'],
            'service': lead['service'],
            'description': lead['description'],
            'location': lead['location'],
            'score': lead['score'],
            'created_at': lead['created_at']
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/customer/leads/<int:lead_id>/claim', methods=['POST'])
@token_required
def claim_lead(lead_id):
    """Claim a lead (mark as claimed)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verify customer has access to this lead
        cursor.execute('''
            SELECT cl.id, cl.status FROM customer_leads cl
            WHERE cl.lead_id = ? AND cl.customer_id = ?
        ''', (lead_id, request.customer_id))
        
        customer_lead = cursor.fetchone()
        if not customer_lead:
            return jsonify({'error': 'Lead not found or not assigned to you'}), 404
        
        if customer_lead['status'] != 'available':
            return jsonify({'error': 'Lead already claimed'}), 400
        
        # Mark as claimed
        cursor.execute('''
            UPDATE customer_leads SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (customer_lead['id'],))
        
        cursor.execute('''
            UPDATE leads SET claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (request.customer_id, lead_id))
        
        conn.commit()
        
        return jsonify({'status': 'success', 'message': 'Lead claimed'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/customer/subscribe', methods=['POST'])
@token_required
def subscribe():
    """Subscribe to a plan"""
    data = request.json
    tier = data.get('tier', 'basic')  # basic, pro, unlimited
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get customer
        cursor.execute('SELECT stripe_customer_id FROM customers WHERE id = ?', (request.customer_id,))
        customer = cursor.fetchone()
        
        # Define tier details
        tiers = {
            'basic': {'price': 2900, 'leads': 10},
            'pro': {'price': 7900, 'leads': 50},
            'unlimited': {'price': 19900, 'leads': 999}
        }
        
        if tier not in tiers:
            return jsonify({'error': 'Invalid tier'}), 400
        
        tier_info = tiers[tier]
        
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=tier_info['price'],
            currency='gbp',
            metadata={
                'customer_id': request.customer_id,
                'tier': tier
            }
        )
        
        return jsonify({
            'client_secret': intent.client_secret,
            'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY'),
            'amount': tier_info['price'],
            'leads': tier_info['leads']
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/customer/subscription/confirm', methods=['POST'])
@token_required
def confirm_subscription():
    """Confirm subscription after payment"""
    data = request.json
    tier = data.get('tier')
    stripe_subscription_id = data.get('stripe_subscription_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        tiers = {
            'basic': {'leads': 10},
            'pro': {'leads': 50},
            'unlimited': {'leads': 999}
        }
        
        if tier not in tiers:
            return jsonify({'error': 'Invalid tier'}), 400
        
        # Update customer subscription
        cursor.execute('''
            UPDATE customers SET subscription_tier = ? WHERE id = ?
        ''', (tier, request.customer_id))
        
        # Create subscription record
        cursor.execute('''
            INSERT INTO subscriptions (customer_id, tier, stripe_subscription_id, status, leads_per_month)
            VALUES (?, ?, ?, 'active', ?)
        ''', (request.customer_id, tier, stripe_subscription_id, tiers[tier]['leads']))
        
        conn.commit()
        
        return jsonify({'status': 'success', 'tier': tier}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

# ==================== EXISTING ENDPOINTS (HOMEOWNER SIDE) ====================

# Routes for HTML files
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/admin.html')
def admin():
    return send_from_directory('frontend', 'admin.html')

@app.route('/payment.html')
def payment():
    return send_from_directory('frontend', 'payment.html')

# API Routes
@app.route('/api/submit-lead', methods=['POST'])
def submit_lead():
    """Submit a lead from homeowner"""
    data = request.json
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO leads (name, email, phone, service, description, location)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('email'),
            data.get('phone'),
            data.get('service'),
            data.get('description'),
            data.get('location')
        ))
        
        lead_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({'lead_id': lead_id, 'status': 'success'}), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/get-leads', methods=['GET'])
def get_leads():
    """Get all leads (for admin)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT id, name, email, phone, service, description, location, score, created_at, claimed_by
            FROM leads
            ORDER BY created_at DESC
        ''')
        
        leads = []
        for row in cursor.fetchall():
            leads.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'phone': row['phone'],
                'service': row['service'],
                'description': row['description'],
                'location': row['location'],
                'score': row['score'],
                'created_at': row['created_at'],
                'claimed_by': row['claimed_by']
            })
        
        return jsonify({'leads': leads}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/score-lead/<int:lead_id>', methods=['POST'])
def score_lead(lead_id):
    """Score a single lead using AI"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM leads WHERE id = ?', (lead_id,))
        lead = cursor.fetchone()
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
        
        # Simple scoring logic: score based on description length and keywords
        description = lead['description'].lower()
        score = 50  # Base score
        
        # Boost score for quality indicators
        if len(description) > 100:
            score += 15
        if 'urgent' in description or 'asap' in description:
            score += 10
        if 'budget' in description:
            score += 10
        if 'quote' in description or 'estimate' in description:
            score += 5
        
        # Cap at 100
        score = min(score, 100)     
        cursor.execute('UPDATE leads SET score = ? WHERE id = ?', (score, lead_id))
        conn.commit()
        
        return jsonify({'lead_id': lead_id, 'score': score}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/score-all-leads', methods=['POST'])
def score_all_leads():
    """Score all unscored leads"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id, name, service, description, location FROM leads WHERE score IS NULL')
        leads = cursor.fetchall()
        
        scored_count = 0
        for lead in leads:
            try:
                # Simple scoring logic
                description = lead['description'].lower()
                score = 50
                if len(description) > 100:
                    score += 15
                if 'urgent' in description or 'asap' in description:
                    score += 10
                if 'budget' in description:
                    score += 10
                score = min(score, 100)
                cursor.execute('UPDATE leads SET score = ? WHERE id = ?', (score, lead['id']))
                scored_count += 1
            except:
                cursor.execute('UPDATE leads SET score = ? WHERE id = ?', (50, lead['id']))
                scored_count += 1
        
        conn.commit()
        return jsonify({'status': 'success', 'scored': scored_count}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create Stripe payment intent"""
    data = request.json
    amount = data.get('amount', 2999)
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='gbp',
            metadata={'plan': data.get('plan', 'starter')}
        )
        
        return jsonify({
            'client_secret': intent.client_secret,
            'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

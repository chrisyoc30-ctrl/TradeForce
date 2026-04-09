import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
import stripe

app = Flask(__name__, static_folder='frontend', static_url_path='')

# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://tradescoreglasgow-site.onrender.com", "http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Data storage (in-memory for demo)
leads = []
lead_id_counter = 1

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
    global lead_id_counter
    
    data = request.json
    
    lead = {
        'id': lead_id_counter,
        'name': data.get('name'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'service': data.get('service'),
        'description': data.get('description'),
        'location': data.get('location'),
        'score': None
    }
    
    leads.append(lead)
    lead_id_counter += 1
    
    return jsonify({'lead_id': lead['id'], 'status': 'success'}), 201

@app.route('/api/get-leads', methods=['GET'])
def get_leads():
    return jsonify({'leads': leads}), 200

@app.route('/api/score-lead/<int:lead_id>', methods=['POST'])
def score_lead(lead_id):
    lead = next((l for l in leads if l['id'] == lead_id), None)
    
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404
    
    try:
        prompt = f"""Score this lead on a scale of 1-100 based on quality and likelihood to convert.
        
Lead Details:
- Name: {lead['name']}
- Service: {lead['service']}
- Description: {lead['description']}
- Location: {lead['location']}

Respond with ONLY a number between 1-100."""
        
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        score = int(response.choices[0].message.content.strip())
        lead['score'] = score
        
        return jsonify({'lead_id': lead_id, 'score': score}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/score-all-leads', methods=['POST'])
def score_all_leads():
    for lead in leads:
        if lead['score'] is None:
            try:
                prompt = f"""Score this lead on a scale of 1-100.
Lead: {lead['name']} - {lead['service']} - {lead['description']}
Respond with ONLY a number."""
                
                response = client.chat.completions.create(
                    model='gpt-3.5-turbo',
                    messages=[{'role': 'user', 'content': prompt}]
                )
                
                lead['score'] = int(response.choices[0].message.content.strip())
            except:
                lead['score'] = 50
    
    return jsonify({'status': 'success', 'scored': len(leads)}), 200

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
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
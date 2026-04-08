from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import stripe
import json
import os
from datetime import datetime
import openai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure APIs
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
openai.api_key = os.getenv('OPENAI_API_KEY')

LEADS_FILE = 'leads.json'

# Initialize leads file
if not os.path.exists(LEADS_FILE):
    with open(LEADS_FILE, 'w') as f:
        json.dump([], f)

@app.route('/')
def home():
    return jsonify({'status': 'ok', 'message': 'TradeForce API running'})

@app.route('/api/submit-lead', methods=['POST'])
def submit_lead():
    data = request.json
    lead = {
        'id': len(get_leads()) + 1,
        'name': data.get('name'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'service': data.get('service'),
        'location': data.get('location'),
        'description': data.get('description'),
        'timestamp': datetime.now().isoformat(),
        'score': None
    }
   
    leads = get_leads()
    leads.append(lead)
    save_leads(leads)
   
    return jsonify({'status': 'success', 'lead_id': lead['id']})

@app.route('/api/get-leads', methods=['GET'])
def get_leads_endpoint():
    return jsonify(get_leads())

@app.route('/api/score-lead/<int:lead_id>', methods=['POST'])
def score_lead(lead_id):
    leads = get_leads()
    lead = next((l for l in leads if l['id'] == lead_id), None)
   
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404
   
    # Score using OpenAI
    prompt = f"""Score this lead from 1-100 based on quality:
    Name: {lead['name']}
    Service: {lead['service']}
    Description: {lead['description']}
   
    Consider: urgency, budget indicators, location match.
    Return only a number 1-100."""
   
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[{'role': 'user', 'content': prompt}]
    )
   
    score = int(response['choices'][0]['message']['content'].strip())
    lead['score'] = score
    save_leads(leads)
   
    return jsonify({'lead_id': lead_id, 'score': score})

@app.route('/api/score-all-leads', methods=['POST'])
def score_all_leads():
    leads = get_leads()
    for lead in leads:
        if lead['score'] is None:
            prompt = f"""Score this lead from 1-100 based on quality:
            Name: {lead['name']}
            Service: {lead['service']}
            Description: {lead['description']}
           
            Consider: urgency, budget indicators, location match.
            Return only a number 1-100."""
           
            response = openai.ChatCompletion.create(
                model='gpt-3.5-turbo',
                messages=[{'role': 'user', 'content': prompt}]
            )
           
            score = int(response['choices'][0]['message']['content'].strip())
            lead['score'] = score
   
    save_leads(leads)
    return jsonify({'status': 'success', 'leads_scored': len(leads)})

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    data = request.json
    amount = data.get('amount')  # in pence
    email = data.get('email')
   
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='gbp',
            metadata={'email': email}
        )
        return jsonify({'clientSecret': intent.client_secret})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def get_leads():
    try:
        with open(LEADS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_leads(leads):
    with open(LEADS_FILE, 'w') as f:
        json.dump(leads, f, indent=2)

if __name__ == '__main__':
    app.run(debug=True, port=5000)


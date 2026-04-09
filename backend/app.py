import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import stripe

app = Flask(__name__)

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

# HTML Templates (Embedded)
INDEX_HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TradeScore - Lead Submission</title>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DM Sans', sans-serif;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
            background-attachment: fixed;
            color: #e0e0e0;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                linear-gradient(0deg, transparent 24%, rgba(255, 193, 7, 0.05) 25%, rgba(255, 193, 7, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 193, 7, 0.05) 75%, rgba(255, 193, 7, 0.05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(255, 193, 7, 0.05) 25%, rgba(255, 193, 7, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 193, 7, 0.05) 75%, rgba(255, 193, 7, 0.05) 76%, transparent 77%, transparent);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 0;
        }

        .container {
            position: relative;
            z-index: 1;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        header {
            text-align: center;
            margin-bottom: 50px;
        }

        h1 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 48px;
            letter-spacing: 2px;
            color: #ffc107;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 14px;
            color: #999;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .form-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 193, 7, 0.2);
            border-radius: 8px;
            padding: 40px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #ffc107;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input, select, textarea {
            width: 100%;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 4px;
            color: #e0e0e0;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.12);
            border-color: #ffc107;
            box-shadow: 0 0 10px rgba(255, 193, 7, 0.2);
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        .submit-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
            color: #000;
            border: none;
            border-radius: 4px;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 16px;
            letter-spacing: 1px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 193, 7, 0.4);
        }

        .success-message {
            display: none;
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4caf50;
            color: #4caf50;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
        }

        .error-message {
            display: none;
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid #f44336;
            color: #f44336;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            text-align: center;
        }

        .nav-links {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
        }

        .nav-links a {
            color: #ffc107;
            text-decoration: none;
            margin: 0 15px;
            transition: color 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .nav-links a:hover {
            color: #ffb300;
        }

        .loading {
            display: none;
            text-align: center;
            color: #ffc107;
        }

        .spinner {
            border: 2px solid rgba(255, 193, 7, 0.2);
            border-top: 2px solid #ffc107;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>TradeScore</h1>
            <p class="subtitle">Get Qualified Leads Instantly</p>
        </header>

        <div class="form-card">
            <div class="success-message" id="successMessage">
                ✓ Lead submitted successfully! Redirecting to dashboard...
            </div>
            <div class="error-message" id="errorMessage"></div>

            <form id="leadForm">
                <div class="form-group">
                    <label for="name">Your Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>

                <div class="form-group">
                    <label for="email">Email Address *</label>
                    <input type="email" id="email" name="email" required>
                </div>

                <div class="form-group">
                    <label for="phone">Phone Number *</label>
                    <input type="tel" id="phone" name="phone" required>
                </div>

                <div class="form-group">
                    <label for="service">Trade Type *</label>
                    <select id="service" name="service" required>
                        <option value="">Select a trade...</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Carpentry">Carpentry</option>
                        <option value="Painting">Painting</option>
                        <option value="Landscaping">Landscaping</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Roofing">Roofing</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="description">Project Description *</label>
                    <textarea id="description" name="description" required></textarea>
                </div>

                <div class="form-group">
                    <label for="location">Location *</label>
                    <input type="text" id="location" name="location" placeholder="Glasgow, G1 1AA" required>
                </div>

                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p>Submitting lead...</p>
                </div>

                <button type="submit" class="submit-btn" id="submitBtn">Submit Lead</button>
            </form>

            <div class="nav-links">
                <a href="/admin.html">View Dashboard</a>
                <a href="/payment.html">View Pricing</a>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('leadForm');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');
        const loading = document.getElementById('loading');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                service: document.getElementById('service').value,
                description: document.getElementById('description').value,
                location: document.getElementById('location').value
            };

            loading.style.display = 'block';
            submitBtn.disabled = true;
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';

            try {
                const response = await fetch('/api/submit-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    successMessage.style.display = 'block';
                    form.reset();
                    setTimeout(() => {
                        window.location.href = '/admin.html';
                    }, 2000);
                } else {
                    errorMessage.textContent = data.error || 'Failed to submit lead.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'Error submitting lead.';
                errorMessage.style.display = 'block';
            } finally {
                loading.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>'''

# Routes
@app.route('/')
def index():
    return INDEX_HTML, 200, {'Content-Type': 'text/html'}

@app.route('/admin.html')
def admin():
    # Read from file since it's large
    try:
        with open('/opt/render/project/src/frontend/admin.html', 'r') as f:
            return f.read(), 200, {'Content-Type': 'text/html'}
    except:
        try:
            with open('frontend/admin.html', 'r') as f:
                return f.read(), 200, {'Content-Type': 'text/html'}
        except:
            return "Admin page not found", 404

@app.route('/payment.html')
def payment():
    # Read from file since it's large
    try:
        with open('/opt/render/project/src/frontend/payment.html', 'r') as f:
            return f.read(), 200, {'Content-Type': 'text/html'}
    except:
        try:
            with open('frontend/payment.html', 'r') as f:
                return f.read(), 200, {'Content-Type': 'text/html'}
        except:
            return "Payment page not found", 404

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
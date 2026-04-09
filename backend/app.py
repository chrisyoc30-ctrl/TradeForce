import os
import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from openai import OpenAI
import stripe
from io import BytesIO
from datetime import datetime

# Initialize Flask app
app = Flask(__name__, static_folder='frontend', static_url_path='')

# CORS configuration - Allow requests from frontend and landing page
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://tradeforce-frontend.onrender.com", "https://tradescoreglasgow-site.onrender.com", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize OpenAI and Stripe
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# In-memory storage for leads (in production, use a database)
leads = {}
next_lead_id = 1

# ==================== HTML ROUTES ====================

@app.route('/')
def index():
    """Serve the lead submission form"""
    try:
        # Try absolute path first (Render)
        with open('/opt/render/project/src/frontend/index.html', 'r') as f:
            return f.read()
    except:
        try:
            # Try relative path (local)
            with open('frontend/index.html', 'r') as f:
                return f.read()
        except:
            return jsonify({'error': 'index.html not found'}), 404

@app.route('/admin.html')
def admin():
    """Serve the dashboard"""
    try:
        # Try absolute path first (Render)
        with open('/opt/render/project/src/frontend/admin.html', 'r') as f:
            return f.read()
    except:
        try:
            # Try relative path (local)
            with open('frontend/admin.html', 'r') as f:
                return f.read()
        except:
            return jsonify({'error': 'admin.html not found'}), 404

@app.route('/payment.html')
def payment():
    """Serve the payment page"""
    try:
        # Try absolute path first (Render)
        with open('/opt/render/project/src/frontend/payment.html', 'r') as f:
            return f.read()
    except:
        try:
            # Try relative path (local)
            with open('frontend/payment.html', 'r') as f:
                return f.read()
        except:
            return jsonify({'error': 'payment.html not found'}), 404

# ==================== API ROUTES ====================

@app.route('/api/submit-lead', methods=['POST'])
def submit_lead():
    """Submit a new lead"""
    global next_lead_id
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'phone', 'email', 'service', 'description', 'location']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create lead object
        lead_id = next_lead_id
        next_lead_id += 1
        
        lead = {
            'id': lead_id,
            'name': data['name'],
            'phone': data['phone'],
            'email': data['email'],
            'service': data['service'],
            'description': data['description'],
            'location': data['location'],
            'submitted_at': datetime.now().isoformat(),
            'score': None,
            'ai_feedback': None
        }
        
        leads[lead_id] = lead
        
        return jsonify({
            'lead_id': lead_id,
            'status': 'success'
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-leads', methods=['GET'])
def get_leads_endpoint():
    """Get all leads"""
    try:
        leads_list = list(leads.values())
        return jsonify({
            'leads': leads_list,
            'total': len(leads_list),
            'scored': len([l for l in leads_list if l['score'] is not None])
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/score-lead/<int:lead_id>', methods=['POST'])
def score_lead(lead_id):
    """Score a single lead using AI"""
    try:
        if lead_id not in leads:
            return jsonify({'error': 'Lead not found'}), 404
        
        lead = leads[lead_id]
        
        # Create prompt for OpenAI
        prompt = f"""
        You are a lead quality scoring expert. Score this lead on a scale of 0-100 based on likelihood to convert.
        
        Lead Details:
        - Name: {lead['name']}
        - Phone: {lead['phone']}
        - Email: {lead['email']}
        - Service Type: {lead['service']}
        - Description: {lead['description']}
        - Location: {lead['location']}
        
        Provide:
        1. A score (0-100)
        2. Brief reasoning (1-2 sentences)
        3. Recommendation (contact/follow-up/skip)
        
        Format your response as JSON:
        {{"score": <number>, "reasoning": "<text>", "recommendation": "<contact/follow-up/skip>"}}
        """
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': prompt}]
        )
        
        # Parse response
        ai_response = response.choices[0].message.content
        
        try:
            ai_data = json.loads(ai_response)
            score = ai_data.get('score', 50)
            reasoning = ai_data.get('reasoning', 'No reasoning provided')
            recommendation = ai_data.get('recommendation', 'follow-up')
        except:
            score = 50
            reasoning = ai_response
            recommendation = 'follow-up'
        
        # Update lead with score
        lead['score'] = score
        lead['ai_feedback'] = reasoning
        lead['recommendation'] = recommendation
        
        return jsonify({
            'lead_id': lead_id,
            'score': score,
            'reasoning': reasoning,
            'recommendation': recommendation
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/score-all-leads', methods=['POST'])
def score_all_leads():
    """Score all leads"""
    try:
        results = []
        
        for lead_id in leads:
            lead = leads[lead_id]
            
            if lead['score'] is not None:
                results.append({
                    'lead_id': lead_id,
                    'score': lead['score'],
                    'status': 'already_scored'
                })
                continue
            
            # Create prompt for OpenAI
            prompt = f"""
            You are a lead quality scoring expert. Score this lead on a scale of 0-100 based on likelihood to convert.
            
            Lead Details:
            - Name: {lead['name']}
            - Phone: {lead['phone']}
            - Email: {lead['email']}
            - Service Type: {lead['service']}
            - Description: {lead['description']}
            - Location: {lead['location']}
            
            Provide:
            1. A score (0-100)
            2. Brief reasoning (1-2 sentences)
            3. Recommendation (contact/follow-up/skip)
            
            Format your response as JSON:
            {{"score": <number>, "reasoning": "<text>", "recommendation": "<contact/follow-up/skip>"}}
            """
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model='gpt-3.5-turbo',
                messages=[{'role': 'user', 'content': prompt}]
            )
            
            # Parse response
            ai_response = response.choices[0].message.content
            
            try:
                ai_data = json.loads(ai_response)
                score = ai_data.get('score', 50)
                reasoning = ai_data.get('reasoning', 'No reasoning provided')
                recommendation = ai_data.get('recommendation', 'follow-up')
            except:
                score = 50
                reasoning = ai_response
                recommendation = 'follow-up'
            
            # Update lead with score
            lead['score'] = score
            lead['ai_feedback'] = reasoning
            lead['recommendation'] = recommendation
            
            results.append({
                'lead_id': lead_id,
                'score': score,
                'status': 'scored'
            })
        
        return jsonify({
            'total_leads': len(leads),
            'scored': len([r for r in results if r['status'] == 'scored']),
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a Stripe payment intent"""
    try:
        data = request.json
        amount = data.get('amount')
        plan = data.get('plan')
        
        if not amount or not plan:
            return jsonify({'error': 'Missing amount or plan'}), 400
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency='gbp',
            metadata={'plan': plan}
        )
        
        return jsonify({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    """Export all leads as CSV"""
    try:
        # Create CSV content
        csv_content = 'ID,Name,Phone,Email,Service,Location,Score,Submitted\n'
        
        for lead_id, lead in leads.items():
            score = lead['score'] if lead['score'] is not None else 'Pending'
            csv_content += f'{lead_id},"{lead["name"]}",{lead["phone"]},{lead["email"]},{lead["service"]},"{lead["location"]}",{score},{lead["submitted_at"]}\n'
        
        # Return as file
        return send_file(
            BytesIO(csv_content.encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name='leads.csv'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# ==================== RUN ====================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
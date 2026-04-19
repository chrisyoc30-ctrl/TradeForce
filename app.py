from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

LEADS_FILE = 'leads.json'

# Initialize leads file
if not os.path.exists(LEADS_FILE):
    with open(LEADS_FILE, 'w') as f:
        json.dump([], f)

def calculate_lead_score(lead_data):
    """Calculate AI lead score based on 5 factors"""
    score = 0
    
    # 1. Contact Quality (20%)
    contact_quality = 0
    if lead_data.get('name') and len(lead_data.get('name', '')) > 2:
        contact_quality += 5
    if lead_data.get('email'):
        contact_quality += 5
    if lead_data.get('phone'):
        contact_quality += 5
    if lead_data.get('company'):
        contact_quality += 5
    score += contact_quality  # Max 20
    
    # 2. Project Value (25%)
    project_value = 0
    project_type = lead_data.get('projectType', '').lower()
    if project_type in ['extension', 'renovation', 'new build']:
        project_value += 15
    elif project_type in ['repair', 'maintenance']:
        project_value += 5
    else:
        project_value += 10
    
    description_length = len(lead_data.get('description', ''))
    if description_length > 100:
        project_value += 10
    elif description_length > 50:
        project_value += 5
    score += min(project_value, 25)  # Max 25
    
    # 3. Urgency (20%)
    timeline = lead_data.get('timeline', '').lower()
    if 'asap' in timeline or 'urgent' in timeline:
        score += 20
    elif 'week' in timeline:
        score += 15
    elif 'month' in timeline:
        score += 10
    else:
        score += 5
    
    # 4. Budget (20%)
    try:
        budget = int(lead_data.get('budget', 0))
        if budget >= 30000:
            score += 20
        elif budget >= 15000:
            score += 15
        elif budget >= 5000:
            score += 10
        elif budget > 0:
            score += 5
    except:
        pass
    
    # 5. Timeline (15%)
    start_date = lead_data.get('startDate', '')
    if start_date:
        score += 15
    else:
        score += 5
    
    return min(score, 100)

def get_grade(score):
    """Convert score to grade"""
    if score >= 90:
        return 'A'
    elif score >= 80:
        return 'B'
    elif score >= 70:
        return 'C'
    elif score >= 60:
        return 'D'
    else:
        return 'F'

def get_recommendation(score, grade):
    """Get recommendation based on score"""
    if grade == 'A':
        return '✅ HIGH PRIORITY: Excellent lead. Follow up within 24 hours.'
    elif grade == 'B':
        return '✅ GOOD LEAD: Strong prospect. Follow up within 48 hours.'
    elif grade == 'C':
        return '⚠️ MODERATE: Follow up when you have capacity.'
    elif grade == 'D':
        return '❓ LOW PRIORITY: Consider for future outreach.'
    else:
        return '❌ LOW VALUE: May not be worth pursuing.'

@app.route('/', methods=['GET'])
def home():
    return jsonify({'status': 'ok', 'message': 'TradeScore API running'})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'TradeScore Backend'}), 200

@app.route('/api/leads', methods=['POST'])
def submit_lead():
    """Submit a new lead and get AI score"""
    try:
        data = request.json
        
        # Calculate AI score
        ai_score = calculate_lead_score(data)
        ai_grade = get_grade(ai_score)
        ai_recommendation = get_recommendation(ai_score, ai_grade)
        
        lead = {
            'id': len(get_leads()) + 1,
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'company': data.get('company'),
            'projectType': data.get('projectType'),
            'description': data.get('description'),
            'budget': data.get('budget'),
            'timeline': data.get('timeline'),
            'startDate': data.get('startDate'),
            'aiScore': ai_score,
            'aiGrade': ai_grade,
            'aiRecommendation': ai_recommendation,
            'submittedAt': datetime.now().isoformat()
        }
        
        leads = get_leads()
        leads.append(lead)
        save_leads(leads)
        
        return jsonify({
            'status': 'success',
            'lead_id': lead['id'],
            'aiScore': ai_score,
            'aiGrade': ai_grade,
            'aiRecommendation': ai_recommendation,
            'scoreBreakdown': {
                'contactQuality': 'Complete' if all([data.get('name'), data.get('email'), data.get('phone')]) else 'Incomplete',
                'projectValue': data.get('projectType', 'Not specified'),
                'urgency': data.get('timeline', 'Not specified'),
                'budget': f"£{data.get('budget', 0)}",
                'timeline': 'Specified' if data.get('startDate') else 'Not specified'
            }
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/leads', methods=['GET'])
def get_leads_endpoint():
    """Get all leads"""
    return jsonify(get_leads()), 200

@app.route('/api/leads/<int:lead_id>', methods=['GET'])
def get_lead(lead_id):
    """Get a specific lead"""
    leads = get_leads()
    lead = next((l for l in leads if l['id'] == lead_id), None)
    if lead:
        return jsonify(lead), 200
    return jsonify({'error': 'Lead not found'}), 404

@app.route('/api/leads/<int:lead_id>', methods=['DELETE'])
def delete_lead(lead_id):
    """Delete a lead"""
    leads = get_leads()
    leads = [l for l in leads if l['id'] != lead_id]
    save_leads(leads)
    return jsonify({'status': 'success'}), 200

def get_leads():
    """Load leads from file"""
    try:
        with open(LEADS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_leads(leads):
    """Save leads to file"""
    with open(LEADS_FILE, 'w') as f:
        json.dump(leads, f, indent=2)

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))

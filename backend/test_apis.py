import os
from dotenv import load_dotenv
from openai import OpenAI
from anthropic import Anthropic as AnthropicClient
from google import genai
import stripe

# Load environment variables
load_dotenv("C:\\Users\\ADMIN\\TradeForce\\.env")

print("=" * 60)
print("TESTING ALL API CONNECTIONS - APRIL 2026")
print("=" * 60)

# 1. OpenAI
print("\n[1/4] Testing OpenAI API...")
try:
    client_oa = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    res_oa = client_oa.chat.completions.create(
        model="gpt-4o", 
        messages=[{"role": "user", "content": "Say 'OpenAI works'"}],
        max_tokens=10
    )
    print("✅ OpenAI API: WORKING")
except Exception as e:
    print(f"❌ OpenAI API: FAILED - {str(e)}")

# 2. Claude (Anthropic)
# FIX: 'claude-3-7-sonnet' was retired Feb 19, 2026. 
# Use 'claude-sonnet-4-20250514' (The stable 4.0 release)
print("\n[2/4] Testing Claude API...")
try:
    client_ant = AnthropicClient(api_key=os.getenv("ANTHROPIC_API_KEY"))
    res_ant = client_ant.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        messages=[{"role": "user", "content": "Say 'Claude works'"}]
    )
    print("✅ Claude API: WORKING")
except Exception as e:
    print(f"❌ Claude API: FAILED - {str(e)}")

# 3. Google Gemini
# FIX: Use 'gemini-3-flash-preview'. 
# In the new SDK, 'gemini-3.1-flash' is not yet the default stable string.
print("\n[3/4] Testing Google Gemini API...")
try:
    client_gem = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
    res_gem = client_gem.models.generate_content(
        model="gemini-3-flash-preview", 
        contents="Say 'Gemini works'"
    )
    print("✅ Google Gemini API: WORKING")
except Exception as e:
    print(f"❌ Google Gemini API: FAILED - {str(e)}")

# 4. Stripe
print("\n[4/4] Testing Stripe API...")
try:
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    stripe.Account.retrieve()
    print("✅ Stripe API: WORKING")
except Exception as e:
    print(f"❌ Stripe API: FAILED - {str(e)}")

print("\n" + "=" * 60)
print("API TESTING COMPLETE")
print("=" * 60)



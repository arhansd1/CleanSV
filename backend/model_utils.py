import os
import re
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# API Keys - Add your keys here
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Add your OpenAI key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Add your Google API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Add your Groq key
# ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # Add your Anthropic key

SYSTEM_PROMPT = """You are a pandas code generator. Follow these rules strictly:

1. Generate ONLY executable pandas Python code
2. Assume the dataframe is named 'df' 
3. Use only pandas operations and basic Python (no imports, no file operations)
4. If instruction is vague, respond EXACTLY: "Can you elaborate?"
5. If operation is impossible/dangerous, respond EXACTLY: "This operation is not possible"
6. Code must be safe (no file operations, eval, exec, loops, or complex logic)
7. Return only the code, no explanations or markdown formatting
8. Common operations: df.drop(), df.fillna(), df.rename(), df.astype(), df.query(), etc.

Examples:
- "remove null values" → df.dropna()
- "fill missing values with 0" → df.fillna(0)
- "rename column A to B" → df.rename(columns={'A': 'B'})
"""

ALLOWED_PATTERNS = [
    r"df\s*\[", r"df\s*\.", r"pd\.", r"to_datetime",
    r"str\.", r"fillna", r"drop", r"rename", r"apply",
    r"map", r"replace", r"astype", r"query", r"round",
    r"upper", r"lower", r"strip", r"dropna", r"isnull",
    r"value_counts", r"groupby", r"sort_values"
]

BLOCKED_PATTERNS = [
    r"import\s+", r"__", r"os\.", r"sys\.", r"subprocess",
    r"eval\s*\(", r"exec\s*\(", r"open\s*\(", r"pickle",
    r"while\s+", r"for\s+(?!.*in\s+df)", r"lambda\s+", r";",
    r"file", r"write", r"read_csv", r"to_csv"
]

def validate_code(code: str) -> bool:
    """Validate generated code for security"""
    if not code or code.strip() in ["Can you elaborate?", "This operation is not possible"]:
        return True
        
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            print(f"Blocked pattern found: {pattern}")
            return False
    
    has_allowed = any(re.search(pattern, code) for pattern in ALLOWED_PATTERNS)
    if not has_allowed:
        print("No allowed patterns found")
        return False
        
    return True

def call_openai_api(context: str, instruction: str) -> str:
    """Call OpenAI API"""
    if not OPENAI_API_KEY:
        return "# OpenAI API key not configured"
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Context:\n{context}\n\nInstruction: {instruction}"}
            ],
            "max_tokens": 200,
            "temperature": 0.1
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].strip()
        else:
            return f"# OpenAI API error: {response.status_code}"
            
    except Exception as e:
        return f"# OpenAI API error: {str(e)}"

def call_gemini_api(context: str, instruction: str) -> str:
    """Call Google Gemini API"""
    if not GEMINI_API_KEY:
        return "# Gemini API key not configured"
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nInstruction: {instruction}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 200
            }
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
        else:
            return f"# Gemini API error: {response.status_code}"
            
    except Exception as e:
        return f"# Gemini API error: {str(e)}"

def call_groq_api(context: str, instruction: str) -> str:
    """Call Groq API"""
    if not GROQ_API_KEY:
        return "# Groq API key not configured"
    
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama3-8b-8192",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Context:\n{context}\n\nInstruction: {instruction}"}
            ],
            "max_tokens": 200,
            "temperature": 0.1
        }
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].strip()
        else:
            return f"# Groq API error: {response.status_code}"
            
    except Exception as e:
        return f"# Groq API error: {str(e)}"

# def call_anthropic_api(context: str, instruction: str) -> str:
#     """Call Anthropic Claude API"""
#     if not ANTHROPIC_API_KEY:
#         return "# Anthropic API key not configured"
    
#     try:
#         headers = {
#             "x-api-key": ANTHROPIC_API_KEY,
#             "Content-Type": "application/json",
#             "anthropic-version": "2023-06-01"
#         }
        
#         payload = {
#             "model": "claude-3-haiku-20240307",
#             "max_tokens": 200,
#             "messages": [
#                 {
#                     "role": "user", 
#                     "content": f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nInstruction: {instruction}"
#                 }
#             ]
#         }
        
#         response = requests.post(
#             "https://api.anthropic.com/v1/messages",
#             headers=headers,
#             json=payload,
#             timeout=10
#         )
        
#         if response.status_code == 200:
#             return response.json()["content"][0]["text"].strip()
#         else:
#             return f"# Anthropic API error: {response.status_code}"
            
#     except Exception as e:
#         return f"# Anthropic API error: {str(e)}"

def generate_code(context: str, instruction: str, api_provider: str = "openai") -> str:
    """Generate pandas code using specified API provider"""
    
    # Clean inputs
    context = context.strip()
    instruction = instruction.strip()
    
    if not instruction:
        return "# No instruction provided"
    
    print(f"Using API provider: {api_provider}")
    print(f"Context: {context[:100]}...")
    print(f"Instruction: {instruction}")
    
    # Call appropriate API
    if api_provider.lower() == "openai":
        code = call_openai_api(context, instruction)
    elif api_provider.lower() == "gemini":
        code = call_gemini_api(context, instruction)
    elif api_provider.lower() == "groq":
        code = call_groq_api(context, instruction)
    # elif api_provider.lower() == "anthropic":
    #     code = call_anthropic_api(context, instruction)
    else:
        return "# Unsupported API provider"
    
    # Clean up response
    code = re.sub(r"```python\n?", "", code)
    code = re.sub(r"\n```", "", code)
    code = code.strip()
    
    print(f"Generated code: {code}")
    
    # Validate code
    if not validate_code(code):
        return f"# Code failed safety validation:\n# {code}"
    
    return code
#backend/model_utils.py
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
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")  # Add your DeepSeek API key
# ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # Add your Anthropic key

SYSTEM_PROMPT = """You are a pandas code generator. Follow these rules strictly:

1. Generate ONLY executable pandas Python code
2. The dataframe is named 'df' - ALWAYS use reassignment pattern: df = df.operation()
3. Use only pandas operations and basic Python (no imports, no file operations)
4. If instruction is vague, respond EXACTLY: "Can you elaborate?"
5. If operation is impossible/dangerous, respond EXACTLY: "This operation is not possible"
6. Code must be safe (no file operations, eval, exec, loops, or complex logic)
7. Return only the code, no explanations or markdown formatting

CRITICAL PATTERN - Always reassign to df:
✓ CORRECT: df = df.drop(columns=['A'])
✗ WRONG: df.drop(columns=['A'])
✓ CORRECT: df = df.fillna(0)
✗ WRONG: df.fillna(0, inplace=True)

Examples:
- "remove null values" → df = df.dropna()
- "fill missing values with 0" → df = df.fillna(0)
- "rename column A to B" → df = df.rename(columns={'A': 'B'})
- "delete column Age" → df = df.drop(columns=['Age'])
- "remove first 3 rows" → df = df.drop(index=[0, 1, 2])
- "keep only rows where Age > 30" → df = df[df['Age'] > 30]
- "reorder columns: B, A, C" → df = df[['B', 'A', 'C']]
- "sort by Name" → df = df.sort_values('Name')
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

# OPEN AI
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
            "model": "gpt-3.5",
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

# GEMINI
def call_gemini_api(context: str, instruction: str) -> str:
    """Call Google Gemini API"""
    if not GEMINI_API_KEY:
        print("Gemini API key not found in environment variables")
        return "# Gemini API key not configured"
    
    try:
        # Use the latest stable endpoint with flash model for better availability
        base_url = "https://generativelanguage.googleapis.com/v1beta"
        model_name = "gemini-2.5-flash-lite"  # Using flash model which has better availability
        
        last_error = None
        url = f"{base_url}/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        
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
        
        print(f"\n--- Gemini API Request ---")
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)[:500]}...")  # Print first 500 chars of payload
        
        response = requests.post(url, json=payload, timeout=10)
        
        print(f"\n--- Gemini API Response ---")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text[:1000]}...")  # Print first 1000 chars of response
        
        if response.status_code == 200:
            try:
                result = response.json()
                if "candidates" in result and result["candidates"]:
                    return result["candidates"][0]["content"]["parts"][0]["text"].strip()
                else:
                    print("Unexpected response format - no candidates found")
                    print(f"Full response: {json.dumps(result, indent=2)}")
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                print(f"Error parsing response: {str(e)}")
                last_error = f"# Gemini API response format error: {str(e)}"
        else:
            last_error = f"# Gemini API error: {response.status_code} - {response.text}"
            print(f"Request failed with status {response.status_code}")
            
        # If we get here, the request failed
        return last_error or "# Gemini API error: Unknown error"
            
    except requests.exceptions.RequestException as e:
        error_msg = f"# Gemini API request failed: {str(e)}"
        print(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"# Gemini API error: {str(e)}"
        print(error_msg)
        return error_msg

#GROQ
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
            "model": "openai/gpt-oss-20b",
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


# ANTHROPIC
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


# DEEPSEEK
# def call_deepseek_api(context: str, instruction: str) -> str:
#     """Call DeepSeek model via OpenRouter API"""
#     if not DEEPSEEK_API_KEY:
#         return "# DeepSeek API key not configured"
#     try:
#         headers = {
#             "Authorization": f"Bearer {DEEPSEEK_API_KEY}",  # actually OpenRouter key
#             "HTTP-Referer": "http://localhost",  # required by OpenRouter
#             "X-Title": "MyApp",                  # required by OpenRouter
#             "Content-Type": "application/json"
#         }
#         payload = {
#             "model": "deepseek/deepseek-r1:free",  # OpenRouter model name
#             "messages": [
#                 {"role": "system", "content": SYSTEM_PROMPT},
#                 {"role": "user", "content": f"Context:\n{context}\n\nInstruction: {instruction}"}
#             ],
#             "temperature": 0.1,
#             "max_tokens": 200
#         }
#         response = requests.post(
#             "https://openrouter.ai/api/v1/chat/completions",  # OpenRouter endpoint
#             headers=headers,
#             json=payload,
#             timeout=20
#         )
#         if response.status_code == 200:
#             data = response.json()
#             return data["choices"][0]["message"]["content"].strip()
#         else:
#             return f"# DeepSeek API error: {response.status_code} - {response.text}"
#     except Exception as e:
#         return f"# DeepSeek API error: {str(e)}"


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
    # elif api_provider.lower() == "deepseek":
    #     code = call_deepseek_api(context, instruction)
    # elif api_provider.lower() == "anthropic":
    #     code = call_anthropic_api(context, instruction)
    else:
        return f"# Unsupported API provider: {api_provider}"
    
    # Clean up the code
    code = re.sub(r"```python\n?", "", code)
    code = re.sub(r"\n```", "", code)
    code = code.strip()
    
    print(f"Generated code: {code}")
    
    # Validate code
    if not validate_code(code):
        return f"# Code failed safety validation:\n# {code}"
     
    return code
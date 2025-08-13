from flask import Flask, request, jsonify
from flask_cors import CORS
from model_utils import generate_code
import os

app = Flask(__name__)
CORS(app)

@app.route('/ai-command', methods=['POST'])
def handle_command():
    try:
        data = request.get_json()
        context = data.get('context', '')
        instruction = data.get('instruction', '')
        api_provider = data.get('api_provider', 'openai')  # Default to OpenAI
        
        print(f"Received request - API: {api_provider}, Instruction: {instruction[:50]}...")
        
        code = generate_code(context, instruction, api_provider)
        
        return jsonify({
            'status': 'success',
            'code': code,
            'api_used': api_provider
        })
        
    except Exception as e:
        print(f"Error in handle_command: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting CSV Cleaner backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
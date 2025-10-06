# CleanSV ( Version 1 )

**CleanSV** is a simple, AI-powered web tool that helps you clean CSV / Excel files the way you want — using plain English.

**Working**
- Upload your dataset (csv / xls / xlsx file)
- Talk to the AI assistant to tell it what changes you’d like (like “drop rows with missing age” or “rename the email column”)
- You will get a code which you can apply and see the results live in the table.
- You can choose to accept or reject each suggestion before it’s applied.
- If you don't like it you can undo /redo your changes with one click
- And once you are done with the changes you can DOWNLOAD your file with 1 click in the same format.


#PS : It works on API calls from OPEN AI , GEMINI , GROK

<img width="1470" height="833" alt="Screenshot 2025-10-05 at 11 47 54 PM" src="https://github.com/user-attachments/assets/3df93c09-5857-4bb6-ba8b-cdb0626f4140" />


---
### Version 1
- no multimessage context .
- Basic level commands , unprecise commands might give no response (will give error message / or ask for more context)
- No green/red highlighton changes on live csv


## Features

- Upload CSV/xlsx files and instantly see the data in your browser
- Talk to an AI agent using natural language — no need to write code
- Get real-time previews of changes before confirming
- Dark and light theme when you click onthe title 
- Accept or reject individual cleaning steps
- Use built-in tools for tasks like removing duplicates, fixing formats, or filling missing values


## VISION for Version 2
- VS code like red/green highlights on changes when checking preview
- Proper login page
- Manual edit block with basic minimum features to complete small tasks
- Smart suggestions based on the structure and quality of your data.
- Another chat block for general chat/ questions about the data.
- chat history / memory
- state safety for refreshing

---

## Getting Started

## .env
- Make a .env file 
with 
OPENAI_API_KEY= your api key
GEMINI_API_KEY=  your api key
GROQ_API_KEY= your api key

### Prerequisites

- Node.js and npm
- Python (recommended with pandas and FastAPI or Flask)

### Setup

To run the project locally:

```bash
# clone the repo
git clone https://github.com/yourusername/cleansv.git
cd cleansv

# backend setup
# OPEN TERMINAL IN MAIN FILE

npm run backend
# (details coming soon)



# frontend setup
# OPEN TERMINAL IN MAIN FILE

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

npm install
npm run dev



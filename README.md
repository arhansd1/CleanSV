# CleanSV ( unfinished )

**CleanSV** is a simple, AI-powered web tool that helps you clean CSV files the way you want — using plain English.

Upload your dataset, talk to the AI assistant to tell it what changes you’d like (like “drop rows with missing age” or “rename the email column”), and see the results live. You can choose to accept or reject each suggestion before it’s applied.


#PS : currently working on pretraining the AI model (deepseek R1) - With A Dataset Of Commands And Output(Code) through huggingface.


![1](https://github.com/user-attachments/assets/59c718e6-ed52-4627-9310-89b864a176c3)

---
### Version 1
- no multimessage context .
- fine-tuned for small(single/double) line commands , unprecise commands might give wrong code (should give error message / or ask for more context)
- No green/red highlighton changes on live csv


## Features

- Upload CSV files and instantly see the data in your browser
- Talk to an AI agent using natural language — no need to write code
- Get real-time previews of changes before confirming
- Accept or reject individual cleaning steps
- Use built-in tools for tasks like removing duplicates, fixing formats, or filling missing values
- Smart suggestions based on the structure and quality of your data


---

## Getting Started

### Prerequisites

- Node.js and npm
- Python (recommended with pandas and FastAPI or Flask)
- Git
- Get a Pretrained model to run minstral7B on to get precise response 

### Setup

To run the project locally:

```bash
# clone the repo
git clone https://github.com/yourusername/cleansv.git
cd cleansv

# frontend setup
# OPEN TERMINAL IN MAIN FILE 
npm install
npm run dev

# backend setup
# OPEN TERMINAL IN MAIN FILE
npm run backend
# (details coming soon)


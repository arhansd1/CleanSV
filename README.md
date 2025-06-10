# CleanSV ( unfinished )

**CleanSV** is a simple, AI-powered web tool that helps you clean CSV files the way you want — using plain English.

Upload your dataset, talk to the AI assistant to tell it what changes you’d like (like “drop rows with missing age” or “rename the email column”), and see the results live. You can choose to accept or reject each suggestion before it’s applied.


#PS : currently working on pretraining the AI model (deepseek R1) - With A Dataset Of Commands And Output(Code) through huggingface.


---

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

### Setup

To run the project locally:

```bash
# clone the repo
git clone https://github.com/yourusername/cleansv.git
cd cleansv

# frontend setup
npm install
npm start

# backend setup
# (details coming soon)


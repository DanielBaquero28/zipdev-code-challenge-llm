# LLM-Powered Candidate Screener

This app allows recruiters to submit a job description and receive the top 30 ranked candidates, using OpenAI's GPT models.

## Tech Stack

- Next.js + TypeScript
- Python (for LLM logic)
- OpenAI GPT-4
- Jest for testing

## Getting Started
- git clone https://github.com/DanielBaquero28/zipdev-code-challenge-llm.git
- cd zipdev-code-challenge-llm
- npm install (inside the app/)
- pip install -r requirements (inside the llm/)
- Add execution permissions to the score_candidates.py file (chmod +x scored_candidates.py). File located in /llm/src/.

Note: You have by default a loaded preprocessed candidates JSON file with the candidates loaded from the raw xlsx file. Feel free to run the preprocessor_candidates.py file if you want to make some adjustments and optimize this process.

## Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key

## Setup and Installation

- **Set Environment Variables:**
  
  Before running the project, ensure you have set the required environment variables. For example, you can open your terminal and run:
  
  ```bash
  export LLM_API_KEY=your_openai_api_key_here

- Alternatively, create a .env file in the project's root llm (zipdev-code-challenge-llm/llm/) directory with contents similar to:
  LLM_API_KEY=your_openai_api_key_here

- Commands:
  To start the development server, run inside the app/:
  npm run dev

  To run the tests, execute inside the app/:
  npm test

### Project Overview

This project implements a candidate scoring application with the following components:

- Python Backend: Loads candidate data, builds prompts for OpenAI's API, processes responses, and ranks candidates.
- Next.js Frontend: Provides a single-page interface where recruiters enter a job description (≤200 characters) and view the top 30 ranked candidates.
- Testing & Validation: Uses Jest to simulate various scenarios (e.g., input validation, Python process failures, invalid JSON output) ensuring robust error handling and user feedback.

For more details on the project's architecture and usage, please refer to the technical report included at the root of this project.
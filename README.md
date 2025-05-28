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
- npm install
- npm run dev

## Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key
- `CACHE_TTL`: Cache duration in seconds (default 600)
import json
import openai
from typing import Any, Dict, List
import time
import os
from dotenv import load_dotenv
import re
import sys

# Load environment variables from .env
load_dotenv()

def load_candidates(file_path: str, batch_size: int = 10) -> List[List[Dict[str, Any]]]:
    """ Loads the candidates and returns the candidates dict. """

    base_dir = os.path.dirname(os.path.realpath(__file__))
    absolute_file_path = os.path.join(base_dir, file_path)

    with open(absolute_file_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    # Batch candidates into 10 per list
    return [candidates[i:i + batch_size] for i in range(0, len(candidates), batch_size)]

def build_prompt_2(job_description: str, candidates_batch: List[Dict[str, Any]]) -> str:
    """
    Create a structured prompt that guides the AI recruiter assistant.
    It includes:
      • System instructions specifying the role as a recruiter.
      • Two fixed reference job descriptions (extracted from the PDFs) as context.
      • The user-provided job description.
      • Few-shot examples demonstrating the expected JSON output.
      • Up to 10 candidate entries for evaluation.
    
    The evaluation should prioritize the requirements (must-haves) described in 
    the reference job descriptions while ultimately ranking candidates based on 
    how well they match the user-provided job description.
    """

    # Fixed reference job descriptions from PDFs:
    reference_jd_1 = (
        "Reference Job Description 1 – GoLang Developer:\n"
        "Summary: Due to the increasing cybersecurity threats, BCDR solutions have become essential. "
        "This role requires developing high-load, scalable services, supporting production applications, "
        "and writing clean, tested code. Requirements include 2+ years of GoLang experience, 5+ years "
        "overall development experience, team spirit, and a strong academic background in computer science."
    )
    
    reference_jd_2 = (
        "Reference Job Description 2 – Full Stack Ruby on Rails Developer Engineer:\n"
        "Must-haves: 3+ years of production-level Ruby on Rails experience, deep understanding of PostgreSQL, "
        "at least 1+ year working with JavaScript/TypeScript, and expertise with automated testing (RSpec) and API integration. "
        "Nice-to-haves: TailwindCSS, ViewComponent, and Stimulus. Candidates should have a strong grasp of design patterns, "
        "domain-driven development, and effective debugging."
    )
    
    # Combine reference descriptions with the user-provided job description.
    combined_context = (
        "Reference Job Descriptions:\n\n"
        f"{reference_jd_1}\n\n{reference_jd_2}\n\n"
        "User-Provided Job Description:\n"
        f"{job_description}\n\n"
    )
    
    # The system message instructs the AI's role as a recruiter assistant.
    system_message = (
        "You are an AI recruiter assistant. Your job is to evaluate candidates based on their suitability for the position. "
        "In your evaluation, use the context from both the reference job descriptions (above) and the user-provided job description. "
        "Give high priority to the must-have skills and requirements described in the reference texts, while letting the user "
        "description further guide the final ranking. Return a JSON list of candidates with the following fields: id, name, score (0-100), "
        "and highlights (a summary of strengths). The JSON format should be as follows:\n"
        "[\n  {\"id\": \"candidate_id\", \"name\": \"candidate_name\", \"score\": candidate_score, \"highlights\": [\"strength_1\", \"strength_2\"]}\n]"
    )
    
    # Few-shot examples to guide the expected output.
    few_shot_examples = [
        {
            "id": "1",
            "name": "Candidate 1",
            "score": 90,
            "highlights": [
                "More than 5 years of experience in production-level Rails development and intermediate GoLang exposure.",
                "Expert in PostgreSQL performance tuning and automated testing.",
                "Exhibits strong team collaboration and problem-solving skills."
            ]
        },
        {
            "id": "2",
            "name": "Candidate 2",
            "score": 60,
            "highlights": [
                "Limited exposure to both GoLang and Rails applications.",
                "Basic understanding of relational databases and automated testing.",
                "Marginal alignment with the must-have requirements in the reference descriptions."
            ]
        }
    ]
    
   # Format candidates clearly and consistently.
    candidate_texts = "\n".join(
        [
            f"Candidate {i+1}: Name: {candidate.get('name', 'N/A')}, Skills: {candidate.get('skills', 'N/A')}"
            for i, candidate in enumerate(candidates_batch)
        ]
    )

    
    
    # Build the final prompt by concatenating system instructions, reference context, examples, and candidate data.
    user_prompt = (
        f"{combined_context}\n"
        f"Examples:\n{json.dumps(few_shot_examples, indent=4)}\n\n"
        f"Candidates to Evaluate:\n{candidate_texts}\n\n"
        "Return a structured JSON ranking these candidates."
    )
    
    return (system_message, user_prompt)

def build_prompt_constrained(job_description: str, candidates_batch: List[Dict[str, Any]]) -> str:
    """
    Build a constrained prompt that directs the AI to return ONLY a valid JSON array.
    This prompt is more simplified and explicitly instructs on the output format.
    """

    # More constrained system message emphasizing strict JSON output.
    system_message = (
        "You are an AI technical recruiter. You must evaluate candidates based solely on the job description provided. "
        "Return ONLY a JSON array of candidate objects, with no additional explanation or formatting. "
        "Each candidate object must include the keys: 'id', 'name', 'score' (a numeric value), and 'highlights' (an array of strings). "
        "Do not include any markdown formatting, no code fences, and no extra text."
    )


    few_shot_example = [
        {
            "id": "1",
            "name": "Candidate 1",
            "score": 90.2,
            "highlights": ["Strong in Ruby on Rails", "Good problem-solving skills"],
        }
    ]

    # Formatting candidates for structured scoring
    #candidate_texts = "\n".join([f"Candidate {i+1}: {candidate}" for i, candidate in enumerate(candidates_batch)])
    # Format candidates clearly and consistently.
    candidate_texts = "\n".join(
        [
            f"Candidate {i+1}: Name: {candidate.get('name', 'N/A')}, Skills: {candidate.get('skills', 'N/A')}"
            for i, candidate in enumerate(candidates_batch)
        ]
    )


    user_prompt = (
        "Example:\n"
        f"{json.dumps(few_shot_example, indent=2)}\n\n"
        "Job Description:\n"
        f"{job_description}\n\n"
        "Candidates:\n"
        f"{candidate_texts}\n\n"
        "Return ONLY a valid JSON array structured as shown in the example above."
    )

    return (system_message, user_prompt)


def call_openai(system_msg: str, user_msg: str, max_retries: int = 3, sleep_time: int = 2) -> str:
    """Query OpenAI API using the latest OpenAI SDK format with exponential backoff."""
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Error: OPENAI_API_KEY is missing! Please check your .env file.")
    
    client = openai.OpenAI(api_key=api_key)

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg}
                    ],
                temperature=0.57
            )
            print("Raw OpenAI Response:", response, file=sys.stderr)

            # ✅ STOP execution immediately after returning valid response
            return response.choices[0].message.content

        except openai.OpenAIError as e:
            if attempt == max_retries - 1:  # ✅ Avoid infinite retry loop
                print(f"OpenAI API Error: {e}. Max retries reached, exiting...")
                return "{}"  # Return empty JSON on failure
            print(f"OpenAI API Error: {e}. Retrying in {sleep_time} seconds...")
            time.sleep(sleep_time)
            sleep_time *= 2  # Exponential backoff

    return "{}"  # Return empty JSON if all retries fail


def parse_response(response: str) -> list:
    """Validate and parse JSON from OpenAI response while removing unnecessary formatting."""

    try:
        # Remove Markdown-style code block before parsing
        clean_response = re.sub(r"^```json\n|\n```$", "", response.strip())

        print("After Clean Response: " + clean_response, file=sys.stderr)

        if not clean_response.startswith('['):
            raise ValueError("Output does not appear to be a JSON array.")

        parsed_data = json.loads(clean_response)

        if isinstance(parsed_data, list) and all("id" in c and "name" in c and "score" in c for c in parsed_data):
            return parsed_data
        else:
            print("Invalid JSON format detected. Retrying with simpler constraints...")
            return []
    except json.JSONDecodeError:
        print("Failed to parse JSON response. Raw response:", response)
        return []
    
def score_candidates(job_description: str, file_path: str = "processed_candidates.json") -> List[Dict[str, Any]]:
    """ Evaluates candidates and returns ranked results. """

    all_batches = load_candidates(file_path)
    scored_candidates = []
    print(f"Total batches to process: {len(all_batches)}", file=sys.stderr)

    for idx, batch in enumerate(all_batches, start=1):
        print(f"Processing batch {idx}/{len(all_batches)} with {len(batch)} candidates", file=sys.stderr)

        #First attempt
        # Get both the system message and the user prompt.
        system_msg, user_msg = build_prompt_2(job_description, batch)
        print("System Message:\n", system_msg, file=sys.stderr)
        print("User Prompt:\n", user_msg, file=sys.stderr)
        
        response = call_openai(system_msg, user_msg)

        parsed_results = parse_response(response)
        # If parsing fails (empty list), retry with a more constrained prompt
        if not parsed_results:
            print("First response parsing failed. Retrying with a more constrained prompt", file=sys.stderr)

            system_msg_constrained, user_msg_constrained = build_prompt_constrained(job_description, batch)
            retry_response = call_openai(system_msg_constrained, user_msg_constrained)
            parsed_results = parse_response(retry_response)

        scored_candidates.extend(parsed_results)

    scored_candidates = [c for c in scored_candidates if "score" in c]

    # Sort candidates by score in descending order and return top 30
    return sorted(scored_candidates, key=lambda x: x["score"], reverse=True)[:30]

if __name__ == "__main__":
    # Ensure a job description is passed as an argument
    if len(sys.argv) < 2:
        print("Error: A job description must be provided as an argument.", file=sys.stderr)
        sys.exit(1)


    job_description = sys.argv[1]
    file_path = "processed_candidates.json"

    scored_candidates = score_candidates(job_description, file_path)
    
    sys.stdout.write(json.dumps(scored_candidates, indent=4))
    sys.stdout.flush()

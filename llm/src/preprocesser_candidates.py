import pandas as pd
import json
import re
from bs4 import BeautifulSoup
from typing import Any, List, Dict

INPUT_FILE = "zipdev-candidate-database-raw.xlsx"
OUTPUT_FILE = "candidates_clean.json"

def clean_text(text: Any) -> str:
    """ Normalize text: lowercase, trim whitespace, remove HTML tags and special characters, and deduplicate repeats. """
    
    if not isinstance(text, str):
        return str(text) # Ensures non-string entries are converted to str
    
    text = text.strip().lower() # Removes whitespaces and converts to lowercase
    text = BeautifulSoup(text, "html.parser").get_text() # Removes HTML tags
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Removes special characters
    words = text.split()

    # Deduplicate obvious repeats
    seen: set[str] = set()
    processed_text: str = ' '.join([word for word in words if not (word in seen or seen.add(word))])

    return processed_text

def preprocess() -> List[Dict[str, Any]]:
    """ Read an Excel file and preprocess text columns. """

    # Load Excel (only first sheet)
    df: pd.DataFrame = pd.read_excel(INPUT_FILE)
    text_columns: List[str] = ["Name", "Job title", "Job department", "Job location", "Headline", 
                               "Summary", "Keywords", "Educations", "Experiences", "Skills", 
                               "Disqualification reason", "Disqualification note"]
    
    # Convert only text columns to string first
    for column in df.select_dtypes(include=["float64"]).columns:
        df[column] = df[column].astype(str)

    # Replace all nan values with empty strings
    df.fillna("", inplace=True)
    
    for column in text_columns:
        if column in df.columns:
            df[column] = df[column].apply(clean_text)
        
    df.drop_duplicates(inplace=True) # Remove duplicate rows

    # Convert DataFrame to JSON format
    processed_data: List[Dict[str, Any]] = df.astype(str).to_dict(orient="records")

    # Write to JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(processed_data, f, indent=4, ensure_ascii=False)

    print(f"✅ Saved {len(processed_data)} cleaned candidates to {OUTPUT_FILE}")

    return processed_data

if __name__ == '__main__':
    processed_data: List[Dict[str, Any]] = preprocess()

    #print("Processed data saved to processed_candidates.json!")
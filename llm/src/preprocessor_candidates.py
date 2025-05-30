import pandas as pd
import re
import json
from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning
from typing import List, Dict, Any
import warnings

warnings.filterwarnings("ignore", category=MarkupResemblesLocatorWarning)

def preprocess_text(text: Any) -> str:
    """
    Normalize text: lowercase, trim whitespace, remove HTML tags and special characters,
    and deduplicate repeated words.
    """
    if pd.isna(text):
        return ""  # Return empty string if NaN
    if not isinstance(text, str):
        text = str(text)
    text = text.lower().strip()
    text = BeautifulSoup(text, "html.parser").get_text()  # Remove HTML tags
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)  # Remove special characters
    text = re.sub(r"\s+", " ", text).strip() # Collapse multiple spaces into one
    words = text.split()
    seen = set()
    processed_text = " ".join([word for word in words if word not in seen and not seen.add(word)])
    return processed_text

def process_excel(file_path: str) -> List[Dict[str, Any]]:
    """
    Read an Excel file, preprocess the relevant text columns, handle boolean columns properly,
    and export the cleaned data to a JSON file.
    """
    # Read Excel file (adjust the sheet name if needed)
    df = pd.read_excel(file_path, sheet_name="Sheet1")

    # Define the text columns you want to preprocess (adjust as needed)
    text_columns = [
        "Name", "Job title", "Job department", "Job location", "Headline",
        "Summary", "Keywords", "Educations", "Experiences", "Skills",
        "Disqualification reason", "Disqualification note", "Answer 1", "Question 1",
        "Answer 2", "Question 2", "Answer 3", "Question 3", "Answer 4", "Question 4",
        "Answer 5", "Question 5", "Answer 6", "Question 6", "Answer 7", "Question 7"
    ]

    # Process numeric (float) columns:
    # If a column contains only 0.0 and 1.0, we treat it as boolean.
    # Otherwise, convert the float to string.
    for column in df.select_dtypes(include=["float64"]).columns:
        # Exclude "" (empty strings) to get unique non-empty values.
        unique_vals = {v for v in df[column].unique() if v != ""}
        if unique_vals.issubset({0.0, 1.0}):
            # Map numeric booleans to their original text values.
            df[column] = df[column].apply(lambda x: "VERDADERO" if x == 1.0 else ("FALSO" if x == 0.0 else ""))
        else:
            df[column] = df[column].astype(str)

    # Replace any remaining NaN values in the DataFrame with an empty string.
    df.fillna("", inplace=True)
    # Replace "NaT" in any column (e.g., date/time fields) with an empty string.
    df.replace("NaT", "", inplace=True)

    # Replace fields containing exactly 'nan' or 'nat' (case-insensitive) with an empty string.
    df.replace(to_replace=r'^(?i:nan|nat)$', value='', regex=True, inplace=True)

    # Apply text preprocessing to columns specified in text_columns
    for column in text_columns:
        if column in df.columns:
            df[column] = df[column].apply(preprocess_text)

    # Remove duplicate rows in the DataFrame.
    df.drop_duplicates(inplace=True)

    # Convert DataFrame to a list of dictionaries.
    processed_data = df.astype(str).to_dict(orient="records")

    # Write the processed candidates to a JSON file.
    with open("processed_candidates.json", "w", encoding="utf-8") as json_file:
        json.dump(processed_data, json_file, indent=4, ensure_ascii=False)

    return processed_data

if __name__ == "__main__":
    # Example usage: process the raw XLSX file and save the processed JSON.
    file_path = "zipdev-candidate-database-raw.xlsx"
    processed_data = process_excel(file_path)
    print("Processed data saved to processed_candidates.json!")

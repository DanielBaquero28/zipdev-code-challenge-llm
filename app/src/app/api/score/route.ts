import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// Simple in-memory caching (keyed by job description)
const cache = new Map<string, { result: any; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobDescription } = body;

    // Validate input: jobDescription must exist and be <= 200 characters.
    if (!jobDescription || jobDescription.length > 200) {
      return NextResponse.json(
        { error: "Invalid job description: must be provided and ≤200 characters." },
        { status: 400 }
      );
    }

    // ✅ Set CORS headers to allow frontend requests
    const responseHeaders = new Headers({
      "Access-Control-Allow-Origin": "*", // Allow all origins (adjust if needed)
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    // Check cache
    if (cache.has(jobDescription)) {
      const entry = cache.get(jobDescription)!;
      if (Date.now() < entry.expires) {
        //console.log("Cache hit. Returning cached results.");
        return NextResponse.json(entry.result, { status: 200 });
      } else {
        cache.delete(jobDescription);
      }
    }

    // Build the path to the Python scoring script.
    // Adjust the path based on your project structure.
    const pythonScriptPath = path.join(process.cwd(), "..", "llm", "src", "score_candidates.py");

    // Spawn a Python process to run the score_candidates() function.
    // Note: Since the process can take up to 10 minutes, the HTTP request will wait that long.
    const result: string = await new Promise((resolve, reject) => {
      const process = spawn("python", [pythonScriptPath, jobDescription]);

      let resultData = "";
      process.stdout.on("data", (data) => {
        resultData += data.toString();
      });

      process.stderr.on("data", (error) => {
        console.error("Python error:", error.toString());
      });

      process.on("close", (code) => {
        if (code !== 0) {
            console.error(`Python process failed with exit code ${code}`);
            reject(new Error(`Python process failed with exit code ${code}`));
        } else {
            resolve(resultData);
        }
      });
    });

    // Parse the JSON result returned from the Python script.
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
      if (!Array.isArray(parsedResult)) {
        throw new Error("Parsed result is not an array");
      }
    } catch (error: any) {
      console.error("Failed to parse Python output:", result);
      return NextResponse.json(
        { error: "Output parsing error: " + error.message },
        { status: 500 }
      );
    }

    // Cache the parsed result keyed by the job description.
    cache.set(jobDescription, { result: parsedResult, expires: Date.now() + CACHE_TTL });
    //console.log("Caching result for job description.");

    // Return the result (top 30 scored candidates).
    return NextResponse.json(parsedResult, { status: 200, headers: responseHeaders });
  } catch (error: any) {
    console.error("Error processing candidate scoring:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// src/app/api/score/route.test.ts

import { POST } from "./route";
import { NextResponse } from "next/server";
import { spawn } from 'child_process';
import { PassThrough } from "stream";

// Mocking child_process.spawn so we can simulate responses from the Python script.
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

function mockSpawn(data: string, exitCode = 0) {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const eventHandlers: { [key: string]: Function[] } = {};

  // A helper to register event listeners.
  const on = (event: string, callback: (arg?: any) => void) => {
    if (!eventHandlers[event]) {
      eventHandlers[event] = [];
    }
    eventHandlers[event].push(callback);
  };

  // After a short delay, emit the stdout data and then call the close handler.
  setTimeout(() => {
    stdout.emit("data", data);
    stdout.end();
    stderr.end();
    if (eventHandlers["close"]) {
      // Call all handlers for the "close" event after stdout has emitted.
      eventHandlers["close"].forEach((cb) => cb(exitCode));
    }
  }, 10); // A 10ms delay should be sufficient

  return {
    stdout,
    stderr,
    on,
  };
}


const mockOpenAIResponse = JSON.stringify([
  { id: "1", name: "Candidate 184", score: 90, highlights: ["Excellent skillset"] },
]);

describe("API route /api/score", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Validation tests for the input ---
  it("returns 400 if jobDescription is missing", async () => {
    const request = new Request("http://localhost/api/score", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toMatch(/Invalid job description/);
  });

  it("returns 400 if jobDescription is over 200 characters", async () => {
    const tooLongJobDesc = "a".repeat(201);
    const request = new Request("http://localhost/api/score", {
      method: "POST",
      body: JSON.stringify({ jobDescription: tooLongJobDesc }),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toMatch(/Invalid job description/);
  });

  // --- Tests for successful processing ---
  it("returns candidate list when provided with valid jobDescription", async () => {
    // Fake result returned from Python (e.g., a JSON array with a candidate)
    // const fakeResult = JSON.stringify([
    //   { id: "1", name: "Candidate 1", score: 75, highlights: ["3+ years exoerience with GoLang"] },
    // ]);

    // When spawn is called, return our mocked response.
    (spawn as jest.Mock).mockReturnValue(mockSpawn(mockOpenAIResponse, 0));
    
    const validJob = "A valid job description.";
    const request = new Request("http://localhost/api/score", {
      method: "POST",
      body: JSON.stringify({ jobDescription: validJob }),
      headers: { "Content-Type": "application/json" },
    });
    
    const response = await POST(request);
    const json = await response.json();
    //console.log("JSON: " + JSON.stringify(json, null, 2))

    expect(response.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    //expect(json[0].name).toBe("Candidate 184");
  });

  // --- Simulate Python process failure ---
  it("returns error if Python process fails", async () => {
    // Simulate the spawn process returning an exit code other than 0.
    (spawn as jest.Mock).mockReturnValue(mockSpawn("", 1));

    const validJob = "Valid job description";
    const request = new Request("http://localhost/api/score", {
      method: "POST",
      body: JSON.stringify({ jobDescription: validJob }),
      headers: { "Content-Type": "application/json" },
    });

    // In this scenario the promise should reject.
    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(JSON.stringify(json)).toEqual('{"error":"Internal server error"}');
  });

  // --- Simulate invalid JSON output from Python ---
  it("returns error if output is invalid JSON", async () => {

    // Return a string that is not valid JSON.
    const invalidJson = "Total batches: 20";
    (spawn as jest.Mock).mockReturnValue(mockSpawn(invalidJson, 0));

    const validJob = "Valid job description";
    const request = new Request("http://localhost/api/score", {
      method: "POST",
      body: JSON.stringify({ jobDescription: validJob }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toMatch(/Output parsing error/);
  });
});

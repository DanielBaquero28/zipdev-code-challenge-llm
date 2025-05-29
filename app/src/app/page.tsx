'use client';

import { useState } from "react";
import axios from "axios";
import { Candidate } from "@/types";

export default function HomePage() {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  async function findCandidates() {
      if (jobDescription.length === 0) {
      setError("Job description cannot be empty.");
      return;
    }

    if (jobDescription.length > 200) {
      setError("Job description must be ≤200 characters.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post("/api/score", { jobDescription }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setCandidates(response.data);
    } catch (err) {
      setError("Error retrieving candidates. Please try again.");
      console.error("API Error: ", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">AI Candidate Ranking</h1>
      
      <textarea
        className="border p-2 w-96"
        placeholder="Provide a job description..."
        maxLength={200}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 mt-4"
        onClick={findCandidates}
        disabled={loading}
      >
        {loading ? "Finding the best candidates..." : "Generate Ranking"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {candidates.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Top 30 Candidates:</h2>
          <table className="border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2 text-black">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Score</th>
                <th className="border border-gray-300 px-4 py-2 text-black">Highlights</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="border border-gray-300 px-4 py-2">{candidate.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{candidate.score}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <ul>
                      {candidate.highlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

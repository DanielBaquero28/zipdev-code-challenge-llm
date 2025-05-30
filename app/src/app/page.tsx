'use client';

import { useState } from "react";
import axios from "axios";
import { Candidate } from "@/types";
import { Search, Users, Sparkles, Trophy, Star, Clock, CheckCircle } from "lucide-react";



export default function HomePage() {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  const characterCount = jobDescription.length;
  const maxLength = 200;
  const isNearLimit = characterCount > 150;

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
    setShowResults(false);

    try {
      const response = await axios.post("/api/score", { jobDescription }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setCandidates(response.data);
      setShowResults(true);
    } catch (err) {
      setError("Error retrieving candidates. Please try again.");
      console.error("API Error: ", err);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 95) return "text-emerald-600 bg-emerald-50";
    if (score >= 90) return "text-blue-600 bg-blue-50";
    if (score >= 85) return "text-amber-600 bg-amber-50";
    return "text-gray-600 bg-gray-50";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 95) return <Trophy className="w-4 h-4" />;
    if (score >= 90) return <Star className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Recruitment
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Candidate</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe your ideal role and let our AI match you with the top candidates from our talent pool
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Job Description</h2>
            </div>
            
            <div className="relative">
              <textarea
                className={`w-full p-4 border-2 rounded-xl resize-none transition-all duration-200 placeholder:text-gray-600 text-gray-800 ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                } focus:ring-4 focus:outline-none`}
                placeholder="Describe the role, required skills, experience level, and any specific qualifications you're looking for..."
                maxLength={maxLength}
                rows={4}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (error) setError('');
                }}
              />
              
              <div className={`absolute bottom-3 right-3 text-sm ${
                isNearLimit ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {characterCount}/{maxLength}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              className={`w-full mt-6 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95'
              } text-white shadow-lg hover:shadow-xl`}
              onClick={findCandidates}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing candidates...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Find Top Candidates
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {showResults && candidates.length > 0 && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Trophy className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Top Candidates</h2>
                <p className="text-gray-600">Ranked by AI compatibility score</p>
              </div>
            </div>

            <div className="grid gap-6">
              {candidates.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">#{index + 1}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {candidate.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Available for interview</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold ${getScoreColor(candidate.score)}`}>
                        {getScoreIcon(candidate.score)}
                        <span>{candidate.score}% match</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 mb-3">Key Highlights</h4>
                      <div className="grid gap-2">
                        {candidate.highlights.map((highlight, highlightIndex) => (
                          <div key={highlightIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        View Profile
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                        Schedule Interview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
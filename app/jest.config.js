module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.js"],
    transform: {
    "^.+\\.tsx?$": "ts-jest",        // Transform TypeScript files with ts-jest.
    "^.+\\.js$": "babel-jest",       // Transform JavaScript files with babel-jest.
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(node-fetch)/)" // Ensure node-fetch is transformed.
  ],
};
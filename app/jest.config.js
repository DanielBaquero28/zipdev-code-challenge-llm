module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.js$": "babel-jest",
  },
  // Transform node-fetch and data-uri-to-buffer even though they are in node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!((node-fetch)|(data-uri-to-buffer)))/"
  ],
};

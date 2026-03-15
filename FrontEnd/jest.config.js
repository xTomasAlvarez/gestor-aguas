export default {
  testEnvironment: "node",
  transform: {},
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/__tests__/**/*.properties.test.js"
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js"
  }
};

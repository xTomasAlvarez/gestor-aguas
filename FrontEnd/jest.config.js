export default {
  testEnvironment: "jest-environment-jsdom",
  extensionsToTreatAsEsm: ['.jsx'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/__tests__/**/*.properties.test.js"
  ],
  moduleNameMapper: {
    "^@/core/http/api$": "<rootDir>/__mocks__/core/http/api.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"]
};

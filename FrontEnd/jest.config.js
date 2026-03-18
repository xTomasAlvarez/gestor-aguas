export default {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/__tests__/**/*.properties.test.js"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js"
  }
};

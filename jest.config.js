module.exports = {
  projects: [
    '<rootDir>/customer-service/jest.config.js',
    '<rootDir>/product-service/jest.config.js',
    '<rootDir>/order-service/jest.config.js',
    '<rootDir>/payment-service/jest.config.js',
    '<rootDir>/worker-service/jest.config.js',
  ],
  maxWorkers: 1,
  testTimeout: 30000,
};

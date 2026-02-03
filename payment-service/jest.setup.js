const { TestDatabase, mockRabbitMQ } = require('../test-utils');

// Mock RabbitMQ
jest.mock('./src/rabbitmq', () => ({
  RabbitMQPublisher: {
    getInstance: () => ({
      connect: jest.fn(),
      publish: jest.fn(),
      disconnect: jest.fn(),
    }),
  },
}));

beforeAll(async () => {
  await TestDatabase.connect();
});

afterAll(async () => {
  await TestDatabase.disconnect();
});

afterEach(async () => {
  await TestDatabase.clearDatabase();
  jest.clearAllMocks();
});

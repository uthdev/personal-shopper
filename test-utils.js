class TestDatabase {
  static async connect() {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoose = require('mongoose');
    this.mongod = await MongoMemoryServer.create();
    const uri = this.mongod.getUri();
    await mongoose.connect(uri);
  }

  static async disconnect() {
    const mongoose = require('mongoose');
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.mongod.stop();
  }

  static async clearDatabase() {
    const mongoose = require('mongoose');
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

const mockRabbitMQ = {
  connect: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(undefined),
  channel: {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    bindQueue: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(true),
    consume: jest.fn().mockResolvedValue(undefined),
    ack: jest.fn().mockResolvedValue(undefined),
    nack: jest.fn().mockResolvedValue(undefined),
  },
};

const createMockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
  headers: {},
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

module.exports = {
  TestDatabase,
  mockRabbitMQ,
  createMockRequest,
  createMockResponse,
  createMockNext,
};

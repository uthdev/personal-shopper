const { TestDatabase } = require('../test-utils.js');

beforeAll(async () => {
  await TestDatabase.connect();
});

afterAll(async () => {
  await TestDatabase.disconnect();
});

afterEach(async () => {
  await TestDatabase.clearDatabase();
});
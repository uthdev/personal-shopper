import { TestDatabase } from '../test-utils';

beforeAll(async () => {
  await TestDatabase.connect();
});

afterAll(async () => {
  await TestDatabase.disconnect();
});

afterEach(async () => {
  await TestDatabase.clearDatabase();
});

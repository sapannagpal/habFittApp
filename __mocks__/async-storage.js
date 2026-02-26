const storage = {};

const AsyncStorage = {
  setItem: jest.fn(async (key, value) => { storage[key] = value; }),
  getItem: jest.fn(async (key) => storage[key] ?? null),
  removeItem: jest.fn(async (key) => { delete storage[key]; }),
  multiSet: jest.fn(async (pairs) => { pairs.forEach(([key, value]) => { storage[key] = value; }); }),
  multiGet: jest.fn(async (keys) => keys.map((key) => [key, storage[key] ?? null])),
  multiRemove: jest.fn(async (keys) => { keys.forEach((key) => delete storage[key]); }),
  clear: jest.fn(async () => { Object.keys(storage).forEach((key) => delete storage[key]); }),
};

export default AsyncStorage;

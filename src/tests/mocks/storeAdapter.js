/**
 * Mock implementation of storeAdapter
 */

const getStoreEngine = jest.fn().mockImplementation(() => ({
  add: jest.fn().mockReturnValue(true),
  get: jest.fn(),
  delete: jest.fn().mockReturnValue(true),
  get_page: jest.fn(),
  search_by_content: jest.fn(),
}));

export { getStoreEngine };

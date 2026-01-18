import '@testing-library/jest-dom';

// 環境変数をモック
process.env.REACT_APP_USER_API_URL = 'http://localhost:3001';
process.env.REACT_APP_ADMIN_API_URL = 'http://localhost:8000';

// localStorageをモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// sessionStorageをモック
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;
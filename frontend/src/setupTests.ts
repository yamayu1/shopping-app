import '@testing-library/jest-dom';

// 環境変数をモック
process.env.REACT_APP_USER_API_URL = 'http://localhost:3001';
process.env.REACT_APP_ADMIN_API_URL = 'http://localhost:8000';

// localStorageのメソッドをモック化
jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);
jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// パフォーマンス計測を行う場合は、結果を記録する関数を渡してください
// 例: reportWebVitals(console.log)
// または、アナリティクスエンドポイントに送信できます。詳細: https://bit.ly/CRA-vitals
reportWebVitals();
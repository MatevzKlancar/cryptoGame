import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Ensure keyboard events when loaded in an iframe (fix for itch.io)
window.onload = () => {
  window.focus();
};
window.onclick = () => {
  window.focus();
}; 
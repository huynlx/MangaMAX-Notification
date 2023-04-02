import React from 'react';
import ReactDOM from 'react-dom/client';

// components
import App from '~/App';

// styles
import '~/styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

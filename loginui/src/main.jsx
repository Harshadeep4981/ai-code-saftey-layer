import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '.../src/assets/index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    
    <GoogleOAuthProvider clientId="1001570181062-pocuitksks280j1e7pb9519e15qg849i.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
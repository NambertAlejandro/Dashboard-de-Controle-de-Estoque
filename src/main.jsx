import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import LoginScreen from './LoginScreen.jsx';
import LandingPage from './LandingPage.jsx';
import { sair, temSessao } from './api.js';
import './index.css';

function Sistema() {
  const [autenticado, setAutenticado] = useState(temSessao);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  useEffect(() => {
    const expirar = () => { setAutenticado(false); setMostrarLogin(true); };
    window.addEventListener('sessao-expirada', expirar);
    return () => window.removeEventListener('sessao-expirada', expirar);
  }, []);

  if (!autenticado && !mostrarLogin) return <LandingPage onStart={() => setMostrarLogin(true)} />;
  if (!autenticado) return <LoginScreen onSuccess={() => setAutenticado(true)} />;
  return <App onLogout={() => { sair(); setAutenticado(false); setMostrarLogin(true); }} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
    <Sistema />
  </React.StrictMode>);

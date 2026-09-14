import { useState } from 'react';
import { entrar } from './api.js';

export default function LoginScreen({ onSuccess }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviar = async event => {
    event.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await entrar(login, senha);
      onSuccess();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return <main className="login-page">
    <section className="login-card">
      <div className="login-brand" aria-hidden="true">▾</div>
      <h1>Controle de estoque</h1>
      <p>Entre para acessar os produtos e movimentações.</p>

      <form onSubmit={enviar}>
        <label htmlFor="login">Login</label>
        <input id="login" value={login} onChange={event => setLogin(event.target.value)} autoComplete="username" autoFocus required />

        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={event => setSenha(event.target.value)} autoComplete="current-password" required />

        {erro && <p className="login-error" role="alert">{erro}</p>}
        <button type="submit" disabled={carregando}>{carregando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </section>
  </main>;
}

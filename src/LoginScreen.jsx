import { useState } from 'react';
import { criarConta, entrar } from './api.js';

export default function LoginScreen({ onSuccess }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviar = async event => {
    event.preventDefault();
    setErro('');
    if (criando && senha !== confirmarSenha) {
      setErro('As senhas precisam ser iguais.');
      return;
    }
    setCarregando(true);
    try {
      if (criando) await criarConta(login, senha);
      else await entrar(login, senha);
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
      <p>{criando ? 'Crie uma conta para acessar o estoque.' : 'Entre para acessar os produtos e movimentações.'}</p>

      <form onSubmit={enviar}>
        <label htmlFor="login">Login</label>
        <input id="login" value={login} onChange={event => setLogin(event.target.value)} autoComplete="username" autoFocus required />

        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={event => setSenha(event.target.value)} autoComplete={criando ? 'new-password' : 'current-password'} minLength={criando ? 6 : undefined} required />

        {criando && <>
          <label htmlFor="confirmar-senha">Confirmar senha</label>
          <input id="confirmar-senha" type="password" value={confirmarSenha} onChange={event => setConfirmarSenha(event.target.value)} autoComplete="new-password" minLength="6" required />
        </>}

        {erro && <p className="login-error" role="alert">{erro}</p>}
        <button type="submit" disabled={carregando}>{carregando ? 'Aguarde…' : criando ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <button type="button" className="login-switch" onClick={() => { setCriando(!criando); setErro(''); setSenha(''); setConfirmarSenha(''); }}>
        {criando ? 'Já tenho uma conta' : 'Criar uma conta'}
      </button>
    </section>
  </main>;
}

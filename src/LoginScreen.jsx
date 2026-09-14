import { useState } from 'react';
import { criarConta, entrar, redefinirSenha, solicitarCodigo } from './api.js';
import stocklyLogo from './assets/stockly-logo.svg';

function CampoSenha(props) {
  const [visivel, setVisivel] = useState(false);
  return <div className="password-input">
    <input {...props} type={visivel ? 'text' : 'password'} />
    <button type="button" onClick={() => setVisivel(!visivel)} aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}>
      {visivel ? 'Ocultar' : 'Mostrar'}
    </button>
  </div>;
}

export default function LoginScreen({ onSuccess }) {
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const trocarModo = novoModo => {
    setModo(novoModo);
    setErro('');
    setMensagem('');
    setSenha('');
    setConfirmarSenha('');
    setCodigo('');
  };

  const enviar = async event => {
    event.preventDefault();
    setErro('');
    setMensagem('');
    if ((modo === 'criar' || modo === 'codigo') && senha !== confirmarSenha) {
      setErro('As senhas precisam ser iguais.');
      return;
    }
    setCarregando(true);
    try {
      if (modo === 'entrar') {
        await entrar(email, senha);
        onSuccess();
      } else if (modo === 'criar') {
        await criarConta(email, senha);
        onSuccess();
      } else if (modo === 'recuperar') {
        const resposta = await solicitarCodigo(email);
        setMensagem(resposta.mensagem);
        setModo('codigo');
      } else {
        const resposta = await redefinirSenha(email, codigo, senha);
        setModo('entrar');
        setMensagem(resposta.mensagem);
        setSenha('');
        setConfirmarSenha('');
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const titulo = modo === 'criar' ? 'Criar conta' : modo === 'recuperar' ? 'Recuperar senha' : modo === 'codigo' ? 'Informe o código' : 'Bem-vindo à Stockly';
  return <main className="login-page">
    <section className="login-card">
      <img className="login-logo" src={stocklyLogo} alt="Stockly — Seu estoque, no controle." />
      <h1>{titulo}</h1>
      <p>{modo === 'recuperar' ? 'Enviaremos um código de confirmação para seu Gmail.' : modo === 'codigo' ? 'Confira o código de 6 números recebido no Gmail.' : modo === 'criar' ? 'Crie uma conta usando seu Gmail.' : 'Entre com seu Gmail para acessar o estoque.'}</p>
      <form onSubmit={enviar}>
        <label htmlFor="email">Gmail</label>
        <input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="nome@gmail.com" autoFocus required />

        {modo === 'codigo' && <>
          <label htmlFor="codigo">Código de confirmação</label>
          <input id="codigo" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={codigo} onChange={event => setCodigo(event.target.value.replace(/\D/g, ''))} required />
        </>}

        {modo !== 'recuperar' && <>
          <label htmlFor="senha">{modo === 'codigo' ? 'Nova senha' : 'Senha'}</label>
          <CampoSenha id="senha" value={senha} onChange={event => setSenha(event.target.value)} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} minLength={modo === 'entrar' ? undefined : 6} pattern={modo === 'entrar' ? undefined : '.*[0-9].*'} title="Use pelo menos 6 caracteres e um número" required />
        </>}

        {(modo === 'criar' || modo === 'codigo') && <>
          <label htmlFor="confirmar-senha">Confirmar senha</label>
          <CampoSenha id="confirmar-senha" value={confirmarSenha} onChange={event => setConfirmarSenha(event.target.value)} autoComplete="new-password" minLength="6" pattern=".*[0-9].*" required />
        </>}

        {erro && <p className="login-error" role="alert">{erro}</p>}
        {mensagem && <p className="login-success" role="status">{mensagem}</p>}
        <button type="submit" disabled={carregando}>{carregando ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : modo === 'recuperar' ? 'Enviar código' : modo === 'codigo' ? 'Trocar senha' : 'Entrar'}</button>
      </form>
      {modo === 'entrar' && <button type="button" className="login-switch" onClick={() => trocarModo('recuperar')}>Esqueci minha senha</button>}
      <button type="button" className="login-switch" onClick={() => trocarModo(modo === 'criar' ? 'entrar' : modo === 'entrar' ? 'criar' : 'entrar')}>
        {modo === 'criar' ? 'Já tenho uma conta' : modo === 'entrar' ? 'Criar uma conta' : 'Voltar para entrar'}
      </button>
    </section>
  </main>;
}

import { useEffect, useState } from 'react';
import logo from './Design sem nome (1).svg → stockly-logo.svg.svg';
import hero1 from './16_12_32.png → hero-1.png.png';
import hero2 from './16_12_26.png → hero-6.png.png';
import hero3 from './16_12_19.png → hero-5.png.png';
import hero4 from './16_12_11.png → hero-4.png.png';
import hero5 from './16_12_05.png → hero-3.png.png';
import hero6 from './16_11_58.png → hero-2.png.png';
import './landing.css';

const fotos = [hero1, hero2, hero3, hero4, hero5, hero6];

function BotaoComecar({ onStart }) {
  return <button className="landing-cta" onClick={onStart}>Começar agora</button>;
}

export default function LandingPage({ onStart }) {
  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFotoAtual((atual) => (atual + 1) % fotos.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-carousel" aria-hidden="true">
          <img key={fotos[fotoAtual]} src={fotos[fotoAtual]} alt="" className="active" />
        </div>
        <div className="landing-hero-shade" />

        <header className="landing-header">
          <img src={logo} alt="Stockly" className="landing-logo" />
          <BotaoComecar onStart={onStart} />
        </header>

        <div className="landing-hero-content">
          <p className="landing-kicker">Controle de estoque para qualquer negócio</p>
          <h1>Saiba o que você tem antes que a falta ou o vencimento vire prejuízo.</h1>
          <p className="landing-hero-text">
            A Stockly organiza produtos, entradas, saídas, lotes e validades em um só lugar.
            Simples para usar no dia a dia e claro para tomar decisões.
          </p>
          <BotaoComecar onStart={onStart} />
          <p className="landing-support">Cada conta possui seu próprio estoque.</p>
        </div>

        <div className="landing-dots" aria-hidden="true">
          {fotos.map((_, indice) => <span key={indice} className={indice === fotoAtual ? 'active' : ''} />)}
        </div>
      </section>

      <section className="landing-intro landing-section">
        <p className="landing-section-label">Controle que evita perdas</p>
        <h2>O estoque precisa ajudar seu negócio, e não esconder problemas.</h2>
        <p>
          Produto parado, compra duplicada, item vencido e falta de mercadoria diminuem o lucro.
          Com a Stockly, você acompanha as quantidades e descobre o que precisa de atenção.
        </p>
      </section>

      <section className="landing-features landing-section">
        <article>
          <span>01</span>
          <h3>Cadastre sem complicação</h3>
          <p>Registre nome, código, preço, quantidade, categoria e validade quando precisar.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Receba alertas úteis</h3>
          <p>Veja primeiro os itens com estoque baixo e os produtos mais próximos do vencimento.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Acompanhe cada mudança</h3>
          <p>Registre entradas e saídas e consulte o histórico para entender o que aconteceu.</p>
        </article>
        <article>
          <span>04</span>
          <h3>Trabalhe com segurança</h3>
          <p>Cada usuário entra com sua conta e visualiza somente os dados do próprio estoque.</p>
        </article>
      </section>

      <section className="landing-businesses">
        <div className="landing-business-copy">
          <p className="landing-section-label">Feito para o seu dia a dia</p>
          <h2>Se o seu negócio compra, guarda ou vende produtos, a Stockly pode ajudar.</h2>
          <p>
            Mercadinhos, restaurantes, adegas, açougues, lojas, depósitos e muitos outros
            negócios podem controlar o estoque sem planilhas confusas.
          </p>
        </div>
        <div className="landing-photo-grid">
          <figure><img loading="lazy" src={hero3} alt="Controle de estoque em uma adega" /><figcaption>Adegas e lojas</figcaption></figure>
          <figure><img loading="lazy" src={hero5} alt="Controle de estoque em um restaurante" /><figcaption>Restaurantes</figcaption></figure>
          <figure><img loading="lazy" src={hero6} alt="Controle de estoque em um açougue" /><figcaption>Açougues e mercados</figcaption></figure>
          <figure><img loading="lazy" src={hero4} alt="Pessoa conferindo produtos no celular" /><figcaption>Depósitos e distribuidores</figcaption></figure>
        </div>
      </section>

      <section className="landing-steps landing-section">
        <p className="landing-section-label">Comece em poucos minutos</p>
        <h2>Um caminho simples para colocar o estoque no controle.</h2>
        <div className="landing-step-list">
          <article><strong>1</strong><div><h3>Crie sua conta</h3><p>Use seu e-mail e entre no seu espaço.</p></div></article>
          <article><strong>2</strong><div><h3>Cadastre os produtos</h3><p>Adicione somente as informações que fazem sentido para o negócio.</p></div></article>
          <article><strong>3</strong><div><h3>Registre a movimentação</h3><p>Atualize entradas e saídas para manter os números corretos.</p></div></article>
        </div>
      </section>

      <section className="landing-final">
        <p>Seu estoque, no controle.</p>
        <h2>Comece hoje a enxergar onde seus produtos e seu dinheiro estão.</h2>
        <BotaoComecar onStart={onStart} />
      </section>

      <footer className="landing-footer">
        <img src={logo} alt="Stockly" />
        <p>Controle simples para negócios reais.</p>
      </footer>
    </main>
  );
}

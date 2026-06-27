import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { ThroughlineMark } from "../components/ThroughlineMark";

export function PrivacyPolicy() {
  return (
    <div className="landing">
      <div className="landing-ambient-bg" />
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-mark">
            <ThroughlineMark />
          </span>
          Throughline
        </Link>
        <nav className="landing-nav-links" aria-label="Sections">
          <Link to="/terms">Termos</Link>
        </nav>
        <div className="landing-nav-actions">
          <Link className="landing-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }} to="/">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>
      </header>

      <main className="landing-main" style={{ padding: "6rem 1.5rem 4rem", maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "var(--text-display-lg)", fontWeight: 300, marginBottom: "2rem" }}>Política de Privacidade</h1>
        
        <div className="glass-panel depth-hover" style={{ padding: "2rem", display: "grid", gap: "1.5rem", fontSize: "1.05rem", lineHeight: "1.6", color: "var(--ink-body)" }}>
          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 500, color: "var(--ink-title)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>Local-First (Primeiro Local)</h2>
            <p>
              O Throughline é construído com uma filosofia "local-first". Isso significa que todos os dados das suas tarefas, mapas de projetos e objetivos pessoais ficam exatamente onde pertencem: no seu dispositivo. Utilizamos IndexedDB para armazenar seus dados de forma segura no seu navegador ou aplicativo instalado.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 500, color: "var(--ink-title)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>Notificações Push</h2>
            <p>
              Se você ativar as notificações push, enviaremos apenas o mínimo de dados necessários para acionar o alerta. <strong>Os dados do push são totalmente anonimizados.</strong> Eles contêm apenas identificadores não identificáveis e alertas genéricos de urgência. Os títulos e descrições das suas tarefas nunca passam pelos nossos servidores de notificação.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 500, color: "var(--ink-title)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>Zero Rastreamento ou Analytics</h2>
            <p>
              Não queremos saber como você usa o aplicativo. Não existem rastreadores de terceiros, scripts de analytics ou monitoramento comportamental. Seus fluxos de trabalho e hábitos de estudo são estritamente assunto seu.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 500, color: "var(--ink-title)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>Futura Sincronização em Nuvem</h2>
            <p>
              Quando lançarmos a sincronização entre múltiplos dispositivos, ela será construída com criptografia de ponta a ponta (E2E). Nossos servidores lidarão apenas com pacotes criptografados, criando um ambiente de conhecimento zero onde ninguém—nem mesmo nós—poderá ler seus dados.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

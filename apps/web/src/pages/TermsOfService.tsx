import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function TermsOfService() {
  return (
    <div className="landing-layout">
      <header className="landing-nav">
        <Link to="/" className="brand-mark">
          T/L
        </Link>
      </header>

      <main className="landing-main" style={{ padding: "4rem 1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted)", textDecoration: "none" }}>
            <ArrowLeft size={16} />
            Voltar para o Início
          </Link>
        </div>

        <h1 style={{ fontSize: "var(--text-display-lg)", fontWeight: 300, marginBottom: "2rem" }}>Termos de Serviço</h1>
        
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "1.5rem", fontSize: "1.05rem", lineHeight: "1.6" }}>
          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 300, marginBottom: "0.5rem" }}>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o aplicativo Throughline, você aceita e concorda em estar vinculado a estes Termos de Serviço. Se você não concordar com alguma parte dos termos, não deverá utilizar o serviço.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 300, marginBottom: "0.5rem" }}>2. Uso do Aplicativo</h2>
            <p>
              O Throughline é uma ferramenta de produtividade e estudos. Você é inteiramente responsável por todo o conteúdo que criar, armazenar e gerenciar dentro do aplicativo. Como o aplicativo é "local-first", a responsabilidade pela manutenção dos seus dados no dispositivo é sua, até que serviços em nuvem sejam fornecidos.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 300, marginBottom: "0.5rem" }}>3. Conta e Segurança</h2>
            <p>
              Você é responsável por manter a confidencialidade de suas informações de login e de quaisquer chaves de criptografia geradas. Não nos responsabilizamos por perda de dados resultante da perda de acesso ao seu dispositivo ou chave de criptografia.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 300, marginBottom: "0.5rem" }}>4. Modificações no Serviço</h2>
            <p>
              Reservamo-nos o direito de modificar ou descontinuar o serviço (ou qualquer parte dele) a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por qualquer modificação, suspensão ou descontinuidade do serviço.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

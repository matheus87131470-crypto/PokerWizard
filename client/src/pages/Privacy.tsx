import React from 'react';

export default function Privacy() {
  return (
    <div style={{ paddingTop: 20 }}>
      <h1>Política de Privacidade</h1>
      <div className="card" style={{ marginTop: 12 }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Respeitamos sua privacidade. Coletamos apenas dados necessários para autenticação e melhoria do serviço.
          As informações de pagamento são processadas por provedores externos. Você pode solicitar remoção de dados a qualquer momento.
        </p>
        <ul style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
          <li>Conta: email, nome e status de plano</li>
          <li>Uso: histórico básico de análises para funcionalidade</li>
          <li>Pagamentos: status do PIX e confirmação</li>
        </ul>
        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 12 }}>
          Contato: suporte@pokio.online
        </p>
      </div>
    </div>
  );
}

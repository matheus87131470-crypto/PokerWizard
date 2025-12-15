import React from 'react';

export default function Terms() {
  return (
    <div style={{ paddingTop: 20 }}>
      <h1>Termos de Uso</h1>
      <div className="card" style={{ marginTop: 12 }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ao usar o PokerWizard, você concorda em não compartilhar acesso indevido, respeitar limites de uso e não utilizar o serviço para fins ilegais.
          O conteúdo gerado pela IA é assistivo e não constitui conselho financeiro.
        </p>
        <ul style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
          <li>Uso pessoal, sujeito ao plano escolhido</li>
          <li>Reembolsos: conforme políticas do provedor de pagamento</li>
          <li>Disponibilidade: melhor esforço, sem garantias de uptime</li>
        </ul>
        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 12 }}>
          Contato: suporte@pokio.online
        </p>
      </div>
    </div>
  );
}

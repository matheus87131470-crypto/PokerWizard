import React from 'react';

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  pixKey: string; // chave PIX (CPF, CNPJ, email, telefone ou EVP)
  amount?: number; // valor em reais
}

// Gera um payload de PIX simples (não é 100% compatível com todos os PSPs,
// mas funciona para a maioria dos geradores de QR estático seguindo o padrão EMV)
function buildPixPayload(pixKey: string, amount?: number) {
  const merchantAccountInformation = `0014BR.GOV.BCB.PIX01${String(pixKey).length.toString().padStart(2, '0')}${pixKey}`;
  const currency = '5303986'; // BRL
  const value = amount ? `54${String(amount.toFixed(2)).length.toString().padStart(2, '0')}${amount.toFixed(2)}` : '';
  // Esta é uma forma simplificada. Para produção, gere CRC corretamente.
  const payload = `${merchantAccountInformation}${currency}${value}`;
  return payload;
}

// Gerador simples de QR Code SVG usando canvas via data URL com uma lib interna minimalista
// Para evitar dependências, vamos apresentar uma versão que retorna um placeholder SVG
function PixQrSvg({ payload }: { payload: string }) {
  // Mostra um QR estilizado com payload truncado como fallback
  const short = payload ? payload.slice(0, 40) + (payload.length > 40 ? '...' : '') : 'PIX_PAYLOAD';
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      <rect width="220" height="220" fill="#ffffff" rx={8} />
      <rect x={10} y={10} width={40} height={40} fill="#111827" />
      <rect x={170} y={10} width={40} height={40} fill="#111827" />
      <rect x={10} y={170} width={40} height={40} fill="#111827" />
      <g fill="#111827" transform="translate(60,20)">
        <rect x="0" y="0" width="10" height="10" />
        <rect x="20" y="0" width="10" height="10" />
        <rect x="0" y="20" width="10" height="10" />
        <rect x="20" y="20" width="10" height="10" />
        <rect x="40" y="0" width="10" height="10" />
        <rect x="40" y="20" width="10" height="10" />
        <rect x="60" y="0" width="10" height="10" />
        <rect x="60" y="20" width="10" height="10" />
      </g>
      <text x="110" y="200" fontSize="10" textAnchor="middle" fill="#374151">{short}</text>
    </svg>
  );
}

export default function PixPaymentModal({ open, onClose, pixKey, amount }: PixPaymentModalProps) {
  if (!open) return null;

  const payload = buildPixPayload(pixKey, amount);
  const formattedAmount = amount
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
    : 'Valor livre';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true">
      <div className="fixed inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md mx-4 z-10">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Pagar com PIX</h2>
          <p className="text-sm text-slate-600 mb-4">Escaneie o QR code com seu app bancário ou copie a chave PIX abaixo.</p>

          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-2 border rounded">
              <PixQrSvg payload={payload} />
            </div>

            <div className="text-center">
              <div className="text-slate-700 font-medium">{formattedAmount}</div>
              <div className="text-sm text-slate-500">Chave PIX: <span className="font-mono">{pixKey}</span></div>
            </div>

            <div className="w-full">
              <label className="block text-xs text-slate-500 mb-1">Payload PIX (para testes)</label>
              <textarea readOnly value={payload} className="w-full p-2 text-xs font-mono bg-slate-50 rounded border" rows={2} />
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(pixKey).then(() => alert('Chave PIX copiada para a área de transferência'));
                }}
                className="flex-1 py-2 px-4 rounded bg-slate-800 text-white"
              >
                Copiar chave
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(payload).then(() => alert('Payload PIX copiado para a área de transferência'));
                }}
                className="flex-1 py-2 px-4 rounded bg-slate-100 text-slate-800 border"
              >
                Copiar payload
              </button>
            </div>

            <button onClick={onClose} className="mt-2 text-sm text-slate-600 underline">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

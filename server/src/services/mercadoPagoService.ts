/**
 * Mercado Pago Payment Service
 * 
 * Implementação segura de pagamentos PIX com Mercado Pago
 * Premium só é ativado via webhook oficial após confirmação real
 */

import { MercadoPagoConfig, Payment } from 'mercadopago';
import storage from './storage';
import crypto from 'crypto';

// ===== CONFIGURAÇÃO =====
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';
const PAYMENT_AMOUNT = 3.50; // R$ 3,50

// Inicializa cliente do Mercado Pago
let mpClient: MercadoPagoConfig | null = null;
let paymentClient: Payment | null = null;

export function initMercadoPago(): boolean {
  if (!MP_ACCESS_TOKEN) {
    console.error('[MercadoPago] ❌ MP_ACCESS_TOKEN não configurado!');
    return false;
  }
  
  try {
    mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    paymentClient = new Payment(mpClient);
    console.log('[MercadoPago] ✅ SDK inicializado com sucesso');
    return true;
  } catch (err: any) {
    console.error('[MercadoPago] ❌ Erro ao inicializar:', err.message);
    return false;
  }
}

// ===== TIPOS =====
export interface MPPayment {
  id: string;
  mpPaymentId: number | null;      // ID do Mercado Pago
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  qrCode: string | null;           // Código PIX copia-cola
  qrCodeBase64: string | null;     // QR Code em base64
  ticketUrl: string | null;        // URL do ticket
  createdAt: Date;
  paidAt: Date | null;
  provider: 'mercadopago';
}

// ===== STORAGE =====
const payments = new Map<string, MPPayment>();
const paymentsByMPId = new Map<number, string>(); // mpPaymentId -> id
const PAYMENTS_KEY = 'mp_payments';

async function persistPayments() {
  const arr = Array.from(payments.values()).map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
  }));
  await storage.writeJSON(PAYMENTS_KEY, arr);
}

async function loadPayments() {
  const arr = await storage.readJSON<any[]>(PAYMENTS_KEY, []);
  for (const raw of arr) {
    const payment: MPPayment = {
      ...raw,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      paidAt: raw.paidAt ? new Date(raw.paidAt) : null,
    };
    payments.set(payment.id, payment);
    if (payment.mpPaymentId) {
      paymentsByMPId.set(payment.mpPaymentId, payment.id);
    }
  }
  console.log(`[MercadoPago] Carregados ${payments.size} pagamentos do storage`);
}

loadPayments().catch((e) => console.error('[MercadoPago] Erro ao carregar pagamentos:', e));

// ===== CRIAR PAGAMENTO PIX =====
export async function createPixPayment(userId: string, userEmail: string): Promise<MPPayment> {
  if (!paymentClient) {
    throw new Error('Mercado Pago não inicializado. Configure MP_ACCESS_TOKEN.');
  }

  const internalId = `mp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Criar pagamento no Mercado Pago
    const mpPayment = await paymentClient.create({
      body: {
        transaction_amount: PAYMENT_AMOUNT,
        description: 'PokerWizard Premium - 30 dias',
        payment_method_id: 'pix',
        payer: {
          email: userEmail,
        },
        // Metadados para identificar no webhook
        external_reference: internalId,
        notification_url: process.env.WEBHOOK_URL || undefined,
      }
    });

    // Extrair dados do PIX
    const pointOfInteraction = mpPayment.point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;

    const payment: MPPayment = {
      id: internalId,
      mpPaymentId: mpPayment.id || null,
      userId,
      userEmail,
      amount: PAYMENT_AMOUNT * 100, // Centavos
      status: 'pending',
      qrCode: transactionData?.qr_code || null,
      qrCodeBase64: transactionData?.qr_code_base64 || null,
      ticketUrl: transactionData?.ticket_url || null,
      createdAt: new Date(),
      paidAt: null,
      provider: 'mercadopago',
    };

    payments.set(payment.id, payment);
    if (payment.mpPaymentId) {
      paymentsByMPId.set(payment.mpPaymentId, payment.id);
    }
    await persistPayments();

    console.log(`[MercadoPago] ✅ Pagamento criado: ${payment.id} (MP: ${payment.mpPaymentId})`);
    return payment;

  } catch (err: any) {
    console.error('[MercadoPago] ❌ Erro ao criar pagamento:', err.message);
    throw new Error(`Falha ao criar pagamento PIX: ${err.message}`);
  }
}

// ===== BUSCAR PAGAMENTO POR ID INTERNO =====
export function getPaymentById(paymentId: string): MPPayment | null {
  return payments.get(paymentId) || null;
}

// ===== BUSCAR PAGAMENTO POR ID DO MERCADO PAGO =====
export function getPaymentByMPId(mpPaymentId: number): MPPayment | null {
  const internalId = paymentsByMPId.get(mpPaymentId);
  if (!internalId) return null;
  return payments.get(internalId) || null;
}

// ===== VALIDAR ASSINATURA DO WEBHOOK =====
export function validateWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
  rawBody?: string
): boolean {
  // Se não temos webhook secret configurado, log warning mas permite
  if (!MP_WEBHOOK_SECRET) {
    console.warn('[MercadoPago] ⚠️ WEBHOOK_SECRET não configurado - assinatura não validada');
    return true; // Em desenvolvimento, pode permitir
  }

  if (!xSignature || !xRequestId) {
    console.error('[MercadoPago] ❌ Headers de assinatura ausentes');
    return false;
  }

  try {
    // Parse x-signature header (formato: ts=xxx,v1=xxx)
    const parts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      parts[key.trim()] = value?.trim() || '';
    });

    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) {
      console.error('[MercadoPago] ❌ Formato de assinatura inválido');
      return false;
    }

    // Construir manifest para verificação
    // Formato: id:[data_id];request-id:[x_request_id];ts:[ts];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET);
    hmac.update(manifest);
    const calculatedSignature = hmac.digest('hex');

    const isValid = calculatedSignature === v1;
    
    if (!isValid) {
      console.error('[MercadoPago] ❌ Assinatura inválida');
    }

    return isValid;

  } catch (err: any) {
    console.error('[MercadoPago] ❌ Erro ao validar assinatura:', err.message);
    return false;
  }
}

// ===== VERIFICAR PAGAMENTO DIRETO NO MERCADO PAGO =====
export async function verifyPaymentWithMercadoPago(mpPaymentId: number): Promise<{
  verified: boolean;
  status: string;
  amount: number;
  externalReference: string | null;
}> {
  if (!paymentClient) {
    throw new Error('Mercado Pago não inicializado');
  }

  try {
    const mpPayment = await paymentClient.get({ id: mpPaymentId });

    return {
      verified: true,
      status: mpPayment.status || 'unknown',
      amount: mpPayment.transaction_amount || 0,
      externalReference: mpPayment.external_reference || null,
    };

  } catch (err: any) {
    console.error(`[MercadoPago] ❌ Erro ao verificar pagamento ${mpPaymentId}:`, err.message);
    return {
      verified: false,
      status: 'error',
      amount: 0,
      externalReference: null,
    };
  }
}

// ===== MARCAR PAGAMENTO COMO APROVADO =====
export async function markPaymentAsApproved(paymentId: string): Promise<MPPayment | null> {
  const payment = payments.get(paymentId);
  if (!payment) return null;

  // Evitar duplicação - se já está aprovado, não faz nada
  if (payment.status === 'approved') {
    console.log(`[MercadoPago] ⚠️ Pagamento ${paymentId} já estava aprovado`);
    return payment;
  }

  payment.status = 'approved';
  payment.paidAt = new Date();
  await persistPayments();

  console.log(`[MercadoPago] ✅ Pagamento ${paymentId} marcado como aprovado`);
  return payment;
}

// ===== LISTAR TODOS PAGAMENTOS =====
export function getAllPayments(): MPPayment[] {
  return Array.from(payments.values());
}

// ===== CONSTANTES EXPORTADAS =====
export const PREMIUM_PRICE = PAYMENT_AMOUNT;
export const PREMIUM_DAYS = 30;

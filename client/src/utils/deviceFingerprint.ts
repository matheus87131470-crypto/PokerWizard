/**
 * Gera fingerprint avançado do dispositivo para anti-fraude
 */

interface DeviceInfo {
  userAgent: string;
  acceptLanguage: string;
  screenResolution: string;
  timezone: string;
  canvas?: string;
  webgl?: string;
}

/**
 * Gera um hash de canvas único
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;

    // Desenha texto com várias fontes e cores
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PokerWizard 🎯', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Anti-fraud', 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return '';
  }
}

/**
 * Gera fingerprint WebGL
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) return '';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}~${renderer}`;
  } catch (e) {
    return '';
  }
}

/**
 * Coleta informações do dispositivo para fingerprinting
 */
export function getDeviceFingerprint(): DeviceInfo {
  const nav = navigator as any;

  return {
    userAgent: nav.userAgent || '',
    acceptLanguage: nav.language || nav.userLanguage || '',
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
  };
}

/**
 * Verifica se o e-mail é válido (validação frontend)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Lista de domínios descartáveis conhecidos (validação frontend básica)
 */
const COMMON_DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 
  'mailinator.com', 'trashmail.com', 'yopmail.com'
];

/**
 * Verifica se é e-mail descartável (validação frontend básica)
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return COMMON_DISPOSABLE_DOMAINS.some(disposable => 
    domain === disposable || domain.endsWith('.' + disposable)
  );
}

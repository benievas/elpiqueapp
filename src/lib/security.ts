import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

/**
 * Sanitiza contenido HTML para prevenir XSS
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Escapa caracteres especiales HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
}

/**
 * Validación de URLs
 */
const URLSchema = z.string().url().max(2048);

export function isValidURL(url: string): boolean {
  try {
    URLSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validación de email
 */
const EmailSchema = z.string().email().max(255);

export function isValidEmail(email: string): boolean {
  try {
    EmailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validación de slug
 */
const SlugSchema = z.string().regex(/^[a-z0-9-]+$/);

export function isValidSlug(slug: string): boolean {
  try {
    SlugSchema.parse(slug);
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida contraseña
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe tener mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe tener minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe tener número');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Debe tener símbolo especial (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting simple en memoria
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minuto
): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];

  // Eliminar requests fuera de la ventana
  const recentRequests = requests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);

  return true;
}

/**
 * Audit logging
 */
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  timestamp: Date;
  ip?: string;
  details?: unknown;
}

export async function logAudit(audit: AuditLog): Promise<void> {
  // En producción, esto iría a una tabla de audit en Supabase
  console.log('[AUDIT]', JSON.stringify(audit));
}

import type { User, UserRole } from './types.js';

export const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2,
});

export const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function isAdult(birthDate: string): boolean {
  const date = new Date(birthDate);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 18;
}

export function roleLabel(role: UserRole): string {
  return role === '1' ? 'Administrador' : 'Jugador vendedor';
}

export function canSeeAdultContent(user: User | null): boolean {
  return Boolean(user && isAdult(user.birthDate));
}

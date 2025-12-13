export type Role = 'superuser' | 'admin' | 'controlador' | 'cliente' | 'owner' | 'suporte';

export const ROLES = {
  SUPERUSER: 'superuser',
  ADMIN: 'admin',
  CONTROLADOR: 'controlador',
  CLIENTE: 'cliente',
  OWNER: 'owner',
  SUPORTE: 'suporte',
} as const;

export const DEFAULT_ROLE: Role = ROLES.CLIENTE;
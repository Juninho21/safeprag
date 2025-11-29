export type Role = 'superuser' | 'admin' | 'controlador' | 'cliente' | 'owner';

export const ROLES = {
  SUPERUSER: 'superuser',
  ADMIN: 'admin',
  CONTROLADOR: 'controlador',
  CLIENTE: 'cliente',
  OWNER: 'owner',
} as const;

export const DEFAULT_ROLE: Role = ROLES.CLIENTE;
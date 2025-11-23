export type Role = 'superuser' | 'admin' | 'controlador' | 'cliente';

export const ROLES = {
  SUPERUSER: 'superuser',
  ADMIN: 'admin',
  CONTROLADOR: 'controlador',
  CLIENTE: 'cliente',
} as const;

export const DEFAULT_ROLE: Role = ROLES.CLIENTE;
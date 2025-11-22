export type Role = 'admin' | 'controlador' | 'cliente';

export const ROLES = {
  ADMIN: 'admin',
  CONTROLADOR: 'controlador',
  CLIENTE: 'cliente',
} as const;

export const DEFAULT_ROLE: Role = ROLES.CLIENTE;
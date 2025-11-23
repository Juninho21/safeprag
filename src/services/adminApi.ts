/* eslint-disable no-undef */
import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://us-central1-safeprag-0825.cloudfunctions.net/api';

async function getToken(): Promise<string> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return await user.getIdToken();
}

export interface AdminUser {
  uid: string;
  email?: string;
  displayName?: string;
  disabled?: boolean;
  role?: 'admin' | 'controlador' | 'cliente';
}

interface ApiUser {
  uid: string;
  email?: string;
  displayName?: string;
  disabled?: boolean;
  customClaims?: {
    role?: AdminUser['role'];
  };
}

export async function listUsers(limit = 100, companyId?: string): Promise<AdminUser[]> {
  const token = await getToken();
  let url = `${API_BASE}/admin/users?limit=${limit}`;
  if (companyId) {
    url += `&companyId=${companyId}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao listar usuários: ${res.status}`);
  const data = await res.json() as { users: ApiUser[] };
  return (data.users || []).map((u) => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    disabled: u.disabled,
    role: u.customClaims?.role,
  }));
}

export async function createUser(payload: { email: string; password: string; displayName?: string; role?: AdminUser['role']; companyId?: string }): Promise<AdminUser> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Falha ao criar usuário: ${res.status}`);
  const data = await res.json();
  return { uid: data.uid, email: data.email, displayName: data.displayName, role: data.role };
}

export async function updateUserRole(uid: string, role: AdminUser['role']): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/admin/users/${uid}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(`Falha ao atualizar papel: ${res.status}`);
}

export async function deleteUser(uid: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/admin/users/${uid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao excluir usuário: ${res.status}`);
}

export async function listCompanies(): Promise<any[]> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/admin/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao listar empresas: ${res.status}`);
  const data = await res.json();
  return data.companies || [];
}
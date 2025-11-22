import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import type { Role } from '../types/role';
import { DEFAULT_ROLE } from '../types/role';
import { storageService } from '../services/storageService';

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  role: Role | null;
  companyId: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // Se Auth não estiver disponível, mantém estado como não autenticado
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      // Resolve a role e companyId a partir de claims do Firebase ou localStorage
      try {
        let resolvedRole: Role | null = null;
        let resolvedCompanyId: string | null = null;

        // Tenta obter dos claims do Firebase Auth
        if (currentUser && typeof currentUser.getIdTokenResult === 'function') {
          const token = await currentUser.getIdTokenResult();
          const claimRole = token?.claims?.role as Role | undefined;
          const claimCompanyId = token?.claims?.companyId as string | undefined;

          if (claimRole) {
            resolvedRole = claimRole;
          }

          if (claimCompanyId) {
            resolvedCompanyId = claimCompanyId;
          }
        }

        // Fallback: localStorage (USER_DATA)
        if (!resolvedRole) {
          const userData = storageService.getUserData();
          const storedRole = userData?.role as Role | undefined;
          if (storedRole) {
            resolvedRole = storedRole;
          }
        }

        setRole(resolvedRole ?? DEFAULT_ROLE);
        setCompanyId(resolvedCompanyId);
      } catch (e) {
        console.warn('Falha ao resolver role/companyId do usuário:', e);
        setRole(DEFAULT_ROLE);
        setCompanyId(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value: AuthContextValue = { user, loading, role, companyId, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
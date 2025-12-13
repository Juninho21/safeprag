import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Role } from '../types/role';
import { DEFAULT_ROLE } from '../types/role';
import { storageService } from '../services/storageService';

export interface Subscription {
  status: 'active' | 'pending' | 'expired' | 'canceled';
  planId: string;
  endDate: any;
  paymentId?: string;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  role: Role | null;
  companyId: string | null;
  subscription: Subscription | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Cleanup previous snapshot listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      try {
        let resolvedRole: Role | null = null;
        let resolvedCompanyId: string | null = null;

        if (currentUser) {
          // 1. Get Claims
          if (typeof currentUser.getIdTokenResult === 'function') {
            const token = await currentUser.getIdTokenResult();
            const claimRole = token?.claims?.role as Role | undefined;
            const claimCompanyId = token?.claims?.companyId as string | undefined;

            if (claimRole) resolvedRole = claimRole;
            if (claimCompanyId) resolvedCompanyId = claimCompanyId;
          }

          // 2. Fallback to localStorage
          if (!resolvedRole) {
            const userData = storageService.getUserData();
            const storedRole = userData?.role as Role | undefined;
            if (storedRole) resolvedRole = storedRole;
          }

          setRole(resolvedRole ?? DEFAULT_ROLE);
          setCompanyId(resolvedCompanyId);

          // 3. Setup Firestore Listener for Subscription
          const userRef = doc(db, 'users', currentUser.uid);
          unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              let sub = data.subscription || null;

              // Check if subscription is expired by date locally
              if (sub && sub.status === 'active' && sub.endDate) {
                const now = new Date();
                const endDate = sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
                if (endDate < now) {
                  console.warn('Subscription expired by date check:', endDate);
                  sub = { ...sub, status: 'expired' };
                }
              }

              setSubscription(sub);
            }
          }, (error) => {
            console.error("Error listening to user doc:", error);
          });

        } else {
          setRole(DEFAULT_ROLE);
          setCompanyId(null);
          setSubscription(null);
        }
      } catch (e) {
        console.warn('Falha ao resolver role/companyId do usuário:', e);
        setRole(DEFAULT_ROLE);
        setCompanyId(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value: AuthContextValue = { user, loading, role, companyId, subscription, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
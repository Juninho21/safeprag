import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@belongnet/capacitor-google-auth';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  const authAvailable = Boolean(auth);
  const { user, role, loading: authLoading } = useAuth();

  const isAndroid = Capacitor.getPlatform() === 'android';

  useEffect(() => {
    try {
      const webClientId = (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim() || '759964931590-iiigm5did69ttrjj98unt5pl15ardtb2.apps.googleusercontent.com';
      GoogleAuth.initialize({
        scopes: ['profile', 'email'],
        clientId: webClientId
      });
    } catch (e) {
      console.warn('[GoogleAuth] falha ao inicializar', e);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'superuser' || role === 'admin') {
        navigate('/configuracoes/empresa');
      } else if (role === 'controlador') {
        navigate('/');
      } else if (role === 'cliente') {
        navigate('/downloads');
      } else {
        navigate('/');
      }
    }
  }, [authLoading, user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (!authAvailable) {
        setError('Autenticação não configurada. Configure o Firebase para habilitar login.');
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('[Login Error]', err.code, err.message);

      let message = 'E-mail ou senha incorretos.';

      // Detecção inteligente de contas Google
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Senha incorreta. Se você criou sua conta via Google, clique em "Esqueci a senha" para definir uma senha manual e poder logar por aqui.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado. Verifique o e-mail digitado.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas falhas. Tente novamente em alguns minutos.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail acima para receber o link de redefinição.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (!authAvailable) {
        setError('Autenticação não configurada.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setInfo('Enviamos um link para seu e-mail. Use-o para criar ou redefinir sua senha.');
    } catch (err: any) {
      console.error('[Reset Password Error]', err.code);
      setError('Falha ao enviar e-mail. Verifique se o e-mail está correto.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authAvailable) {
        setError('Autenticação não configurada.');
        return;
      }
      if (isAndroid) {
        const webClientId = (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim() || '759964931590-iiigm5did69ttrjj98unt5pl15ardtb2.apps.googleusercontent.com';
        try {
          await GoogleAuth.initialize({
            scopes: ['profile', 'email'],
            clientId: webClientId
          });
        } catch (initErr) {
          console.warn('[GoogleAuth] init erro', initErr);
        }

        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser?.authentication?.idToken;
        const accessToken = googleUser?.authentication?.accessToken;

        if (!idToken && !accessToken) {
          throw new Error('Não foi possível obter token do Google');
        }

        const credential = GoogleAuthProvider.credential(idToken || undefined, accessToken || undefined);
        await signInWithCredential(auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      console.error('[Google Login Error]', err);
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow-xl rounded-xl p-8 border border-gray-100">
        <div className="text-center">
          <Logo size="2xl" />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100 animate-pulse">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-100">
              {info}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading || !authAvailable}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transform transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'ENTRAR AGORA'}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || !authAvailable}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all active:scale-95 shadow-sm"
            >
              <FcGoogle size={22} />
              Entrar com Google
            </button>
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


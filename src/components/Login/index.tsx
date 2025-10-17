import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import { auth } from '../../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@belongnet/capacitor-google-auth';
import { FcGoogle } from 'react-icons/fc';
// import { toast } from 'react-toastify'; // Removido

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();
  const authAvailable = Boolean(auth);

  useEffect(() => {
    // toast.dismiss(); // Limpa todos os toasts ao entrar na tela de login // Removido
    // Inicializa GoogleAuth (web/ios), no Android usa config do Capacitor
    try {
      GoogleAuth.initialize({
        scopes: ['profile', 'email'],
        serverClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID
      });
    } catch {}
  }, []);

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
      // Autenticação com e-mail e senha (Firebase Auth)
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      const message = err?.message || 'Erro ao fazer login. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (!authAvailable) {
        setError('Autenticação não configurada. Configure o Firebase para habilitar login.');
        return;
      }
      if (!email) {
        setError('Informe seu email para redefinir a senha.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setInfo('Enviamos um link de redefinição de senha para seu e-mail.');
    } catch (err: any) {
      const message = err?.message || 'Falha ao enviar e-mail de redefinição.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authAvailable) {
        setError('Autenticação não configurada. Configure o Firebase para habilitar login.');
        return;
      }
      if (Capacitor.getPlatform() === 'android') {
        // Login nativo com Google dentro do app (sem navegador)
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser?.authentication?.idToken;
        const accessToken = googleUser?.authentication?.accessToken;

        if (!idToken && !accessToken) {
          throw new Error('Não foi possível obter token do Google');
        }

        const credential = GoogleAuthProvider.credential(idToken || undefined, accessToken || undefined);
        await signInWithCredential(auth, credential);
        navigate('/');
      } else {
        // Fallback web (PWA/desktop)
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        navigate('/');
      }
    } catch (err: any) {
      const message = err?.message || 'Erro ao entrar com Google.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow-xl rounded-xl p-8">
        <div className="text-center">
          <Logo size="2xl" />
        </div>
        {!authAvailable && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md p-3">
            Autenticação não configurada. Adicione as variáveis do Firebase para habilitar o login.
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-600 focus:border-blue-600 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-600 focus:border-blue-600 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          {info && (
            <div className="text-green-600 text-sm text-center">{info}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !authAvailable}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading || !authAvailable}
            className="w-full text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Esqueci a senha
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || !authAvailable}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 shadow-sm disabled:opacity-50"
          >
            <FcGoogle size={20} />
            {loading ? 'Aguarde...' : 'Entrar com Google'}
          </button>
          
          {/* Link de cadastro removido */}
        </form>
      </div>
    </div>
  );
}
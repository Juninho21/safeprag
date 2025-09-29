import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
// import { toast } from 'react-toastify';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      // Cadastro desabilitado - sempre redireciona para a página de login
      console.log('📱 Cadastro desabilitado - redirecionando para página de login');
      
      setSuccess(true);
      // toast.success('Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar a conta.');
      console.log('Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar a conta.');
      
      // Redirecionar para a página de login após 5 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar a conta.' 
          } 
        });
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro');
      // toast.error(err.message || 'Erro ao realizar cadastro');
      console.error(err.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="xl" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">
              Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar a conta.
              Você será redirecionado para a página de login em alguns segundos...
            </span>
          </div>
        )}
        
        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirmar Senha
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirmar Senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Faça login
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
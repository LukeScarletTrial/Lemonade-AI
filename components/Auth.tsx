import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Mail, Lock, Code2 } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-ide-bg text-ide-textMain">
      <div className="w-full max-w-md p-8 bg-ide-sidebar border border-ide-border rounded-lg shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-yellow-400 p-3 rounded-full mb-4 text-ide-bg">
            <Code2 size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Lemonade AI</h1>
          <p className="text-ide-text mt-2 text-sm">Power your sourness with AI-driven coding.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ide-text mb-1 uppercase">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ide-text opacity-50">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-ide-activity border border-ide-border rounded text-sm placeholder-gray-500 focus:outline-none focus:border-ide-accent focus:ring-1 focus:ring-ide-accent transition-colors"
                placeholder="developer@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ide-text mb-1 uppercase">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ide-text opacity-50">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-ide-activity border border-ide-border rounded text-sm placeholder-gray-500 focus:outline-none focus:border-ide-accent focus:ring-1 focus:ring-ide-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 text-xs p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-ide-accent hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ide-accent disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-ide-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="font-medium text-ide-accent hover:text-blue-400 focus:outline-none transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
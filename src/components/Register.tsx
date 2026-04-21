import { useState, FormEvent } from 'react';
import { UserPlus } from 'lucide-react';

export default function Register({ onRegister, onNavLogin }: { onRegister: () => void, onNavLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      setSuccess(true);
      setTimeout(() => {
        onRegister();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-10 space-y-8 w-full max-w-[400px] mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
        <p className="text-slate-400 text-sm">Deploy your isolated DB instance</p>
      </div>
      
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center tracking-tight">{error}</div>}
      {success && <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm rounded-lg text-center tracking-tight">Successfully created! Redirecting...</div>}
      
      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Username (Alphanumeric)</label>
          <input 
            type="text" 
            required 
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            value={username} 
            onChange={e => setUsername(e.target.value)}
            className="w-full p-4 rounded-xl input-field text-white placeholder-slate-600 block"
            placeholder="e.g. new_user"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Password</label>
          <input 
            type="password" 
            required 
            minLength={6}
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl input-field text-white placeholder-slate-600 block"
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit" 
          disabled={success}
          className="w-full py-4 rounded-xl font-bold btn-primary text-white mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed block"
        >
          Provision Workspace
        </button>
      </form>
      
      <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-4">
        <p className="text-sm text-slate-400">Already have an account?</p>
        <button onClick={onNavLogin} className="text-sky-400 font-semibold hover:text-sky-300 transition-colors underline underline-offset-4 cursor-pointer text-sm">
          Sign In Instead
        </button>
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest pt-2">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
          SSL Secured
        </span>
        <span>Node.js v20.x</span>
      </div>
    </div>
  );
}

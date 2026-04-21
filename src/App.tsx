/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import Dashboard from './components/Dashboard.tsx';

export default function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not auth');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setView('dashboard');
      })
      .catch((_) => {
        // Not logged in
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans tracking-tight text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-12 font-sans text-slate-50">
      {view === 'dashboard' && user ? (
        <Dashboard user={user} onLogout={() => { setUser(null); setView('login'); }} />
      ) : (
        <div className="flex w-full max-w-6xl h-full gap-12 items-center flex-col lg:flex-row">
          <div className="flex-1 space-y-8 hidden lg:block">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase isolation-badge">
                Architecture: SQLite Isolated Instance
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                Secure Data<br /><span className="text-sky-400">Fragmentation.</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                Deploy a personalized, encrypted database for every user. Complete session isolation with zero-cross-contamination architecture.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40">
                <div className="text-sky-400 font-bold mb-1">Bcrypt Hashing</div>
                <div className="text-slate-500">60-character salt-protected password storage.</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40">
                <div className="text-sky-400 font-bold mb-1">SQLite Pathing</div>
                <div className="text-slate-500">Automated dynamic .db file provisioning.</div>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-[400px]">
             {view === 'login' && <Login onLogin={(u) => { setUser(u); setView('dashboard'); }} onNavRegister={() => setView('register')} />}
             {view === 'register' && <Register onRegister={() => setView('login')} onNavLogin={() => setView('login')} />}
          </div>
        </div>
      )}
    </div>
  );
}

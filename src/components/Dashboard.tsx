import { useState, useEffect, FormEvent } from 'react';
import { Database, LogOut, Plus } from 'lucide-react';

export default function Dashboard({ user, onLogout }: { user: { id: number, username: string }, onLogout: () => void }) {
  const [notes, setNotes] = useState<{ id: number; title: string; content: string; created_at: string }[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/data/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      } else {
        if (res.status === 401) {
          onLogout();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!title) return;
    try {
      const res = await fetch('/api/data/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        fetchNotes();
      } else {
        const errorData = await res.json();
        alert('Error saving note: ' + (errorData.error || res.statusText));
      }
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 h-full text-slate-50">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Personal Workspace</h1>
            <p className="text-sm text-slate-400 mt-1">
              Connected to <code className="px-2 py-1 bg-slate-800/80 rounded-md border border-slate-700 text-xs font-mono text-sky-300">{user.username}.db</code>
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Secure Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-6 text-white tracking-tight">Add New Record</h2>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Encryption keys" 
                  className="w-full p-3 rounded-xl input-field text-white placeholder-slate-600 text-sm block"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Content</label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Secure data payload..." 
                  rows={4}
                  className="w-full p-3 rounded-xl input-field text-white placeholder-slate-600 text-sm resize-none block"
                />
              </div>
              <button 
                type="submit" 
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 btn-primary font-bold text-white text-sm rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Encrypt & Save</span>
              </button>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">Encrypted Records</h2>
              <span className="isolation-badge px-3 py-1 rounded-full text-xs font-semibold">{notes.length} verified</span>
            </div>
            
            {notes.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <Database className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium">No records found in this partition.</p>
                <p className="text-slate-500 text-sm mt-1">Data is completely isolated from other users.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {notes.map(n => (
                  <div key={n.id} className="p-5 glass-card rounded-2xl hover:border-sky-500/30 transition-colors group">
                    <h3 className="font-bold text-white text-lg">{n.title}</h3>
                    {n.content && <p className="text-sm text-slate-300 mt-2 leading-relaxed">{n.content}</p>}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-3">
                       <p className="text-xs text-slate-500 font-mono">ID: {n.id.toString().padStart(4, '0')}</p>
                       <p className="text-xs text-sky-400 font-mono bg-sky-400/10 px-2 py-1 rounded">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

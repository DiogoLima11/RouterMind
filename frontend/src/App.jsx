import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatWindow from './components/ChatWindow';
import MikroTikPanel from './components/MikroTikPanel';
import { chatService } from './services/api';

function AppContent() {
  const { user, loading } = useAuth();
  const [sessions, setSessions]           = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [view, setView]                   = useState('dashboard');

  useEffect(() => { if (user) loadSessions(); }, [user]);

  const loadSessions = async () => {
    try { const { data } = await chatService.getSessions(); setSessions(data); } catch {}
  };

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--black)' }}>
      <span style={{ color:'var(--gray-3)', fontSize:13, fontFamily:'var(--sans)' }}>carregando...</span>
    </div>
  );

  if (!user) return <Login />;

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard />;
      case 'chat': return (
        <ChatWindow
          session={currentSession}
          onSessionCreated={loadSessions}
          sessions={sessions}
          onSelectSession={s => setCurrentSession(s)}
          onNewSession={() => setCurrentSession(null)}
        />
      );
      case 'mikrotik': return <MikroTikPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar view={view} setView={v => { setView(v); if (v !== 'chat') setCurrentSession(null); }} />
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {renderView()}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

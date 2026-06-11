import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';
import MessageBubble from './MessageBubble';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Como configurar firewall básico?',
  'Configure o DNS para 8.8.8.8',
  'Adicione uma regra para bloquear telnet',
  'Como fazer backup do RouterOS?',
];

export default function ChatWindow({ session, onSessionCreated, sessions=[], onSelectSession, onNewSession }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'superadmin';
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef  = useRef(null);
  const sendingRef = useRef(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (session) chatService.getMessages(session.id).then(({ data }) => setMessages(data)).catch(console.error);
    else setMessages([]);
  }, [session]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const handleNewSession = () => {
    setMessages([]);
    setInput('');
    onNewSession?.();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || sendingRef.current) return;
    sendingRef.current = true;
    setInput(''); setLoading(true);
    setMessages(prev => [...prev, { role:'user', content:text, id:Date.now() }]);
    try {
      const { data } = await chatService.ask(text, session?.id || null);
      if (!session) onSessionCreated?.(data.session_id);
      setMessages(prev => [...prev, {
        role:'assistant', content:data.answer, sources:data.sources,
        execute_command:data.execute_command, requires_confirmation:data.requires_confirmation,
        session_id:data.session_id, id:Date.now()+1
      }]);
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Erro ao processar. Verifique o backend.', id:Date.now()+1 }]);
    } finally { setLoading(false); sendingRef.current = false; }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div style={s.container}>
      <div style={s.sidebar}>
        <button style={s.newBtn} onClick={handleNewSession}>
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none" style={{marginRight:6}}>
            <path d="M7.5 1v13M1 7.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Nova conversa
        </button>
        <div style={s.histLabel}>Histórico</div>
        <div style={s.histList}>
          {sessions.map(ss => (
            <div key={ss.id} style={{ ...s.histItem, ...(session?.id === ss.id ? s.histActive : {}) }}>
              <span style={s.histTitle} onClick={() => onSelectSession?.(ss)}>{ss.title}</span>
              <button style={s.histDel} onClick={async (e) => {
                e.stopPropagation();
                try { await import('../services/api').then(m => m.default.delete('/api/chat/sessions/' + ss.id)); } catch {}
                if (session?.id === ss.id) { setMessages([]); onNewSession?.(); }
                onSessionCreated?.();
              }}>×</button>
            </div>
          ))}
          {sessions.length === 0 && <div style={s.histEmpty}>Nenhuma conversa</div>}
        </div>
      </div>

      <div style={s.main}>
        <div style={s.topbar}>
          <div style={s.topbarLeft}>
            <div style={s.topbarTitle}>{session ? session.title : 'Nova conversa'}</div>
          </div>
          <div style={s.topbarRight}>
            {messages.length > 0 && (
              <button style={s.clearBtn} onClick={() => setMessages([])}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" style={{marginRight:5}}>
                  <path d="M5 2h5M2 4h11M4 4l1 9h5l1-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Limpar
              </button>
            )}
            <span style={s.topbarHint}>↵ Enviar · ⇧↵ Nova linha</span>
          </div>
        </div>

        <div style={s.messages}>
          {messages.length === 0 && (
            <div style={s.welcome}>
              <div style={s.welcomeLogo}>
                <img src="/logo.png" alt="logo" style={{ width:48, height:48, borderRadius:12, objectFit:'cover' }} />
              </div>
              <div style={s.welcomeTitle}>MikroTik AI Chatbot</div>
              <div style={s.welcomeSub}>Pergunte sobre redes, firewall, VPN, hardening ou peça para executar configurações.</div>
              <div style={s.suggestGrid}>
                {SUGGESTIONS.map(sg => (
                  <button key={sg} style={s.suggest} onClick={() => setInput(sg)}>{sg}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m => <MessageBubble key={m.id} message={m} onExecuted={onSessionCreated} />)}
          {loading && (
            <div style={s.loadingRow} className="fade-up">
              <div style={s.loadAvatar}>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={s.loadBubble}>
                <div style={s.loadDots}>
                  <span style={{...s.dot, animationDelay:'0s'}} />
                  <span style={{...s.dot, animationDelay:'.2s'}} />
                  <span style={{...s.dot, animationDelay:'.4s'}} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={s.inputWrap}>
          <div style={s.inputBox}>
            <textarea
              ref={textareaRef}
              style={s.textarea}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(e); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Pergunte ou peça uma configuração..."
              rows={1}
            />
            <button style={{ ...s.sendBtn, opacity: loading || !input.trim() ? .35 : 1 }}
              onClick={send} disabled={loading || !input.trim()}>
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                <path d="M1 7.5h13M8 2l6 5.5L8 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { flex:1, overflow:'hidden', display:'flex', background:'var(--black)' },
  sidebar: { width:200, minWidth:200, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:12 },
  newBtn: { display:'flex', alignItems:'center', justifyContent:'center', background:'var(--blue)', color:'#fff', border:'none', borderRadius:'var(--r)', padding:'8px', fontFamily:'var(--sans)', fontSize:12, fontWeight:500, cursor:'pointer', marginBottom:16 },
  histLabel: { fontSize:10, fontWeight:500, color:'var(--gray-3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8, paddingLeft:2 },
  histList: { flex:1, overflowY:'auto' },
  histItem: { display:'flex', alignItems:'center', gap:6, padding:'6px 8px', borderRadius:'var(--r)', cursor:'pointer', marginBottom:1, transition:'background .1s' },
  histActive: { background:'var(--blue-glow)' },
  histTitle: { flex:1, fontSize:12, color:'var(--gray-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  histDel: { background:'transparent', border:'none', color:'var(--gray-3)', fontSize:14, cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0, opacity:.6 },
  histEmpty: { fontSize:11, color:'var(--gray-3)', padding:'6px 8px' },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { padding:'12px 20px', background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 },
  topbarLeft: {},
  topbarTitle: { fontWeight:500, fontSize:13, color:'var(--white)' },
  topbarRight: { display:'flex', alignItems:'center', gap:12 },
  clearBtn: { display:'flex', alignItems:'center', background:'transparent', border:'none', color:'var(--gray-3)', fontFamily:'var(--sans)', fontSize:11, cursor:'pointer', padding:'4px 6px' },
  topbarHint: { fontSize:10, color:'var(--gray-3)' },
  messages: { flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column' },
  welcome: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px', gap:14 },
  welcomeLogo: { marginBottom:4 },
  welcomeTitle: { fontFamily:'var(--sans)', fontWeight:600, fontSize:20, color:'var(--white)', letterSpacing:'-.02em' },
  welcomeSub: { color:'var(--gray-2)', fontSize:13, maxWidth:360, lineHeight:1.6 },
  suggestGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:6, maxWidth:440, width:'100%' },
  suggest: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--gray-2)', fontFamily:'var(--sans)', fontSize:12, padding:'10px 14px', cursor:'pointer', textAlign:'left', lineHeight:1.4, transition:'border-color .15s' },
  loadingRow: { display:'flex', gap:10, marginBottom:22, alignItems:'flex-start' },
  loadAvatar: { width:26, height:26, borderRadius:7, background:'var(--blue-soft)', color:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:18 },
  loadBubble: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'2px 10px 10px 10px', padding:'14px 18px' },
  loadDots: { display:'flex', gap:4, alignItems:'center' },
  dot: { width:5, height:5, borderRadius:'50%', background:'var(--blue)', display:'inline-block', animation:'shimmer 1.2s ease-in-out infinite' },
  inputWrap: { padding:'14px 20px', background:'var(--surface)', borderTop:'1px solid var(--border)', flexShrink:0 },
  inputBox: { display:'flex', alignItems:'flex-end', gap:10, background:'var(--elevated)', border:'1px solid var(--border-2)', borderRadius:'var(--r-lg)', padding:'10px 12px' },
  textarea: { flex:1, background:'transparent', border:'none', color:'var(--white)', fontFamily:'var(--sans)', fontSize:13, resize:'none', outline:'none', lineHeight:1.6, maxHeight:120, minHeight:20 },
  sendBtn: { background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'opacity .15s' },
};

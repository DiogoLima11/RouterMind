import { useState } from 'react';
import api from '../services/api';

export default function MessageBubble({ message, onExecuted, isAdmin = false }) {
  const isUser = message.role === 'user';
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted]   = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const { data } = await api.post('/api/chat/execute', {
        command: message.execute_command,
        session_id: message.session_id
      });
      setExecResult(data);
      setExecuted(true);
      onExecuted?.();
    } catch (e) {
      setExecResult({ status:'error', message: e.response?.data?.detail || e.message });
      setExecuted(true);
    } finally { setExecuting(false); }
  };

  const renderContent = (text) => {
    if (!text) return null;
    return text.split(/(```[\s\S]*?```)/g).map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
        return (
          <div key={i} style={s.codeBlock}>
            <div style={s.codeTop}>
              <span style={s.codeLang}>COMANDO</span>
              <button style={s.copyBtn} onClick={() => navigator.clipboard.writeText(code.trim())}>Copiar</button>
            </div>
            <pre style={s.code}>{code.trim()}</pre>
          </div>
        );
      }
      return <span key={i} style={{ whiteSpace:'pre-wrap' }}>{part}</span>;
    });
  };

  return (
    <div style={{ ...s.row, justifyContent: isUser ? 'flex-end' : 'flex-start' }} className="fade-up">
      {!isUser && (
        <div style={s.avatar}>
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M2.5 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      <div style={{ maxWidth:'80%', display:'flex', flexDirection:'column', gap:8 }}>
        {!isUser && <div style={s.aiTag}>MikroTik AI</div>}

        <div style={isUser ? s.userBubble : s.aiBubble}>
          <div style={s.content}>{renderContent(message.content)}</div>
          {message.sources?.length > 0 && (
            <div style={s.sources}>
              {message.sources.map((src, i) => (
                <span key={i} style={s.source}>
                  <svg width="10" height="10" viewBox="0 0 15 15" fill="none" style={{marginRight:3}}>
                    <path d="M4 2h7l2 2v10H2V2h2zm3 4v5m-2-2h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {src.split('/').pop()}
                </span>
              ))}
            </div>
          )}
        </div>

        {isAdmin && message.requires_confirmation && message.execute_command && !executed && (
          <div style={s.confirmBox}>
            <div style={s.confirmHeader}>
              <svg width="13" height="13" viewBox="0 0 15 15" fill="none" style={{color:'var(--warning)'}}>
                <path d="M7.5 1L14 13H1L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M7.5 6v3M7.5 11v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span style={s.confirmTitle}>Executar no roteador?</span>
            </div>
            <pre style={s.confirmCmd}>{message.execute_command}</pre>
            <div style={s.confirmNote}>Este comando será aplicado diretamente no MikroTik.</div>
            {!confirmed ? (
              <div style={s.confirmBtns}>
                <button style={s.btnConfirm} onClick={() => setConfirmed(true)}>Confirmar</button>
                <button style={s.btnDecline} onClick={() => setExecuted(true)}>Cancelar</button>
              </div>
            ) : (
              <div style={s.confirmBtns}>
                <button style={{...s.btnConfirm, opacity: executing ? .6 : 1}} onClick={handleExecute} disabled={executing}>
                  {executing ? 'Executando...' : 'Executar agora'}
                </button>
                <button style={s.btnDecline} onClick={() => { setConfirmed(false); setExecuted(true); }}>Cancelar</button>
              </div>
            )}
          </div>
        )}

        {executed && execResult && (
          <div style={{ ...s.resultBox, borderColor: execResult.status === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            <div style={{ fontSize:11, fontWeight:500, color: execResult.status === 'success' ? 'var(--success)' : 'var(--danger)', marginBottom:5 }}>
              {execResult.status === 'success' ? '✓ Executado com sucesso' : '✗ Erro na execução'}
            </div>
            <pre style={s.resultCode}>{execResult.result || execResult.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  row: { display:'flex', gap:10, marginBottom:22, alignItems:'flex-start' },
  avatar: { width:26, height:26, borderRadius:7, background:'var(--blue-soft)', color:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:18 },
  aiTag: { fontSize:10, fontWeight:500, color:'var(--gray-2)', letterSpacing:'.06em', textTransform:'uppercase', paddingLeft:2 },
  aiBubble: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'2px 10px 10px 10px', padding:'13px 16px' },
  userBubble: { background:'var(--blue)', borderRadius:'10px 2px 10px 10px', padding:'11px 15px', color:'#fff', fontSize:13, lineHeight:1.6 },
  content: { color:'var(--gray-1)', fontSize:13, lineHeight:1.7 },
  codeBlock: { background:'var(--black)', border:'1px solid var(--border)', borderRadius:6, marginTop:10, overflow:'hidden' },
  codeTop: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 12px', borderBottom:'1px solid var(--border)', background:'var(--surface)' },
  codeLang: { fontSize:9, color:'var(--blue)', letterSpacing:'.1em', fontWeight:500 },
  copyBtn: { background:'transparent', border:'none', color:'var(--gray-2)', fontSize:10, cursor:'pointer', fontFamily:'var(--sans)' },
  code: { padding:14, color:'#7ec8a0', fontSize:12, lineHeight:1.6, overflowX:'auto', fontFamily:'var(--mono)' },
  sources: { display:'flex', gap:6, flexWrap:'wrap', marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' },
  source: { display:'flex', alignItems:'center', fontSize:10, color:'var(--gray-3)', background:'var(--surface)', padding:'2px 8px', borderRadius:4 },
  confirmBox: { background:'var(--elevated)', border:'1px solid rgba(243,156,18,.25)', borderRadius:8, padding:14 },
  confirmHeader: { display:'flex', alignItems:'center', gap:7, marginBottom:10 },
  confirmTitle: { fontSize:12, fontWeight:500, color:'var(--warning)' },
  confirmCmd: { background:'var(--black)', borderRadius:5, padding:'8px 12px', fontFamily:'var(--mono)', fontSize:11, color:'#7ec8a0', marginBottom:8 },
  confirmNote: { fontSize:11, color:'var(--gray-2)', marginBottom:12 },
  confirmBtns: { display:'flex', gap:8 },
  btnConfirm: { background:'var(--blue)', color:'#fff', border:'none', borderRadius:'var(--r)', padding:'7px 16px', fontFamily:'var(--sans)', fontSize:12, fontWeight:500, cursor:'pointer' },
  btnDecline: { background:'transparent', color:'var(--gray-2)', border:'1px solid var(--border-2)', borderRadius:'var(--r)', padding:'7px 16px', fontFamily:'var(--sans)', fontSize:12, cursor:'pointer' },
  resultBox: { background:'var(--elevated)', border:'1px solid', borderRadius:8, padding:12 },
  resultCode: { fontFamily:'var(--mono)', fontSize:11, color:'var(--gray-1)', whiteSpace:'pre-wrap' },
};

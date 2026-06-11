import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ username:'', password:'', email:'' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isRegister) {
        await authService.register({ username: form.username, email: form.email, password: form.password, role: 'user' });
        setSuccess('Conta criada! Faça login.');
        setIsRegister(false);
        setForm({ username: form.username, password: '', email: '' });
      } else {
        const { data } = await authService.login(form.username, form.password);
        login({ username: form.username, role: data.role }, data.access_token);
      }
    } catch (err) {
      setError(isRegister ? (err.response?.data?.detail || 'Erro ao criar conta.') : 'Credenciais inválidas.');
    }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>
            <img src="/logo.png" alt="Ntech" style={s.brandLogo} />
            <span style={s.brandName}>MikroTik AI</span>
          </div>
          <div style={s.headline}>
            Automatize sua<br />
            <span style={s.headlineItalic}>rede com IA</span>
          </div>
          <p style={s.desc}>
            Gerencie roteadores MikroTik, aplique políticas de segurança
            e automatize configurações através de linguagem natural.
          </p>
          <div style={s.features}>
            {['Configuração via chat', 'Execução direta no roteador', 'Base de conhecimento RAG'].map(f => (
              <div key={f} style={s.feature}>
                <div style={s.featureDot} />
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card} className="fade-up">
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>Entrar na plataforma</div>
            <div style={s.cardSub}>TCC 2026 · Diogo Lima</div>
          </div>

          <div style={s.toggleWrap}>
            <button style={{...s.toggleBtn, ...(isRegister ? {} : s.toggleActive)}} onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}>Entrar</button>
            <button style={{...s.toggleBtn, ...(isRegister ? s.toggleActive : {})}} onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}>Criar conta</button>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Usuário</label>
              <input style={s.input} type="text" value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                placeholder="seu usuário" autoFocus />
            </div>
            {isRegister && (
              <div style={s.field}>
                <label style={s.label}>E-mail</label>
                <input style={s.input} type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="seu@email.com" />
              </div>
            )}
            <div style={s.field}>
              <label style={s.label}>Senha</label>
              <input style={s.input} type="password" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••" />
            </div>
            {error   && <div style={s.error}>{error}</div>}
            {success && <div style={s.successMsg}>{success}</div>}
            <button style={{...s.btn, opacity: loading ? .6 : 1}} disabled={loading}>
              {loading ? (isRegister ? 'Criando...' : 'Autenticando...') : (isRegister ? 'Criar conta' : 'Acessar')}
            </button>
          </form>

          {isRegister && (
            <div style={s.registerNote}>
              Contas criadas aqui têm acesso somente leitura. Para acesso administrativo, contate o administrador do sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display:'flex', height:'100vh', background:'var(--black)' },
  left: {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    padding:'60px', borderRight:'1px solid var(--border)',
    background:'linear-gradient(135deg, #0e1012 0%, #080909 100%)',
  },
  leftInner: { maxWidth:420 },
  brand: { display:'flex', alignItems:'center', gap:10, marginBottom:48 },
  brandLogo: { width:32, height:32, borderRadius:8, objectFit:'cover' },
  brandName: { fontFamily:'var(--sans)', fontWeight:600, fontSize:15, color:'var(--white)', letterSpacing:'-.01em' },
  headline: {
    fontFamily:'var(--serif)', fontSize:52, lineHeight:1.1,
    color:'var(--white)', marginBottom:20, letterSpacing:'-.02em',
  },
  headlineItalic: { fontStyle:'italic', color:'var(--blue)' },
  desc: { color:'var(--gray-2)', fontSize:14, lineHeight:1.7, marginBottom:36 },
  features: { display:'flex', flexDirection:'column', gap:12 },
  feature: { display:'flex', alignItems:'center', gap:10 },
  featureDot: { width:5, height:5, borderRadius:'50%', background:'var(--blue)', flexShrink:0 },
  featureText: { color:'var(--gray-1)', fontSize:13 },
  right: { width:440, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px' },
  card: { width:'100%', background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:12, padding:'32px' },
  cardHeader: { marginBottom:28 },
  cardTitle: { fontFamily:'var(--sans)', fontWeight:600, fontSize:18, color:'var(--white)', marginBottom:4 },
  cardSub: { fontSize:12, color:'var(--gray-2)' },
  form: { display:'flex', flexDirection:'column', gap:16 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:11, fontWeight:500, color:'var(--gray-2)', letterSpacing:'.04em', textTransform:'uppercase' },
  input: {
    background:'var(--surface)', border:'1px solid var(--border-2)',
    borderRadius:'var(--r)', padding:'10px 14px',
    color:'var(--white)', fontFamily:'var(--sans)', fontSize:13, outline:'none',
    transition:'border-color .15s',
  },
  error: { background:'rgba(229,57,53,.08)', border:'1px solid rgba(229,57,53,.25)', borderRadius:'var(--r)', padding:'9px 13px', color:'var(--danger)', fontSize:12 },
  toggleWrap: { display:'flex', background:'var(--surface)', borderRadius:'var(--r)', padding:3, marginBottom:20, border:'1px solid var(--border)' },
  toggleBtn: { flex:1, background:'transparent', border:'none', borderRadius:4, padding:'7px', fontFamily:'var(--sans)', fontSize:12, color:'var(--gray-2)', cursor:'pointer', transition:'all .15s' },
  toggleActive: { background:'var(--elevated)', color:'var(--white)', fontWeight:500 },
  successMsg: { background:'rgba(39,174,96,.08)', border:'1px solid rgba(39,174,96,.25)', borderRadius:'var(--r)', padding:'9px 13px', color:'var(--success)', fontSize:12 },
  registerNote: { fontSize:11, color:'var(--gray-3)', textAlign:'center', marginTop:12, lineHeight:1.5 },
  btn: {
    background:'var(--blue)', color:'#fff', border:'none',
    borderRadius:'var(--r)', padding:'11px', fontFamily:'var(--sans)',
    fontWeight:500, fontSize:13, cursor:'pointer', marginTop:4,
    transition:'opacity .15s',
  },
};

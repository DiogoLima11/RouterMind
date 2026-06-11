import { useState, useEffect } from 'react';
import { mikrotikService } from '../services/api';
import api from '../services/api';

export default function MikroTikPanel() {
  const [config, setConfig]         = useState({ host:'', user:'', password:'', port:8728, label:'MikroTik Principal' });
  const [connected, setConnected]   = useState(false);
  const [identity, setIdentity]     = useState('');
  const [saved, setSaved]           = useState([]);
  const [status, setStatus]         = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [log, setLog]               = useState([]);
  const [loading, setLoading]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadConfig();
    loadSaved();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await api.get('/api/mikrotik/config');
      if (data.connected) {
        setConnected(true);
        setConfig(c => ({ ...c, host: data.host, user: data.user, port: data.port, label: data.label }));
        api.get('/api/mikrotik/identity').then(r => setIdentity(r.data?.name || '')).catch(() => {});
      }
    } catch {}
  };

  const loadSaved = async () => {
    try {
      const { data } = await api.get('/api/mikrotik/saved');
      setSaved(data);
    } catch {}
  };

  const addLog = (msg, type='info') =>
    setLog(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));

  const run = async (label, fn) => {
    setLoading(label); addLog('Executando: ' + label);
    try {
      const { data } = await fn();
      addLog('Concluído: ' + label, 'success');
      return data;
    } catch (e) {
      addLog('Erro: ' + (e.response?.data?.detail || e.message), 'error');
    } finally { setLoading(''); }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data } = await api.post('/api/mikrotik/config', config);
      setConnected(true);
      setIdentity(data.identity);
      setShowForm(false);
      addLog('Conectado: ' + data.identity, 'success');
      loadSaved();
    } catch (e) {
      addLog('Erro: ' + (e.response?.data?.detail || e.message), 'error');
    } finally { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    await api.delete('/api/mikrotik/config');
    setConnected(false); setIdentity(''); setStatus(null); setInterfaces([]);
    setConfig({ host:'', user:'', password:'', port:8728, label:'MikroTik Principal' });
    addLog('Desconectado', 'info');
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/api/mikrotik/config/${id}/activate`);
      addLog('Configuração ativada!', 'success');
      loadConfig(); loadSaved();
    } catch (e) {
      addLog('Erro: ' + (e.response?.data?.detail || e.message), 'error');
    }
  };

  const logColor = { info:'var(--gray-2)', success:'var(--success)', error:'var(--danger)' };

  const actions = [
    { label:'Status do dispositivo', fn: async () => { const d = await run('Status', mikrotikService.getStatus); if(d) setStatus(d); }},
    { label:'Listar interfaces',     fn: async () => { const d = await run('Interfaces', mikrotikService.getInterfaces); if(d) setInterfaces(d); }},
    { label:'Aplicar hardening',     fn: () => run('Hardening', mikrotikService.applyHardening) },
    { label:'Criar backup',          fn: () => run('Backup', mikrotikService.createBackup) },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ ...s.dot, background: connected ? 'var(--success)' : 'var(--gray-3)' }} />
          <div>
            <div style={s.headerTitle}>Painel MikroTik</div>
            <div style={s.headerSub}>{connected ? `${identity} · ${config.host}:${config.port}` : 'Nenhum dispositivo ativo'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {connected && <button style={s.btnDanger} onClick={handleDisconnect}>Desconectar</button>}
          <button style={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Adicionar MikroTik'}
          </button>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formTitle}>Configurar MikroTik</div>
          <div style={s.formGrid}>
            <div style={s.field}>
              <label style={s.label}>Label</label>
              <input style={s.input} placeholder="MikroTik Principal"
                value={config.label} onChange={e => setConfig({...config, label: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Porta API</label>
              <input style={s.input} placeholder="8728" type="number"
                value={config.port} onChange={e => setConfig({...config, port: parseInt(e.target.value)})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>IP / Host</label>
              <input style={s.input} placeholder="192.168.1.1"
                value={config.host} onChange={e => setConfig({...config, host: e.target.value})} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Usuário</label>
              <input style={s.input} placeholder="admin"
                value={config.user} onChange={e => setConfig({...config, user: e.target.value})} />
            </div>
            <div style={{ ...s.field, gridColumn:'1/-1' }}>
              <label style={s.label}>Senha</label>
              <input style={s.input} placeholder="••••••••" type="password"
                value={config.password} onChange={e => setConfig({...config, password: e.target.value})} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button style={{ ...s.btnPrimary, opacity: connecting ? .6 : 1 }}
              onClick={handleConnect} disabled={connecting}>
              {connecting ? 'Conectando...' : 'Testar e Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Configs salvas */}
      {saved.length > 0 && (
        <div style={s.savedSection}>
          <div style={s.sectionLabel}>DISPOSITIVOS SALVOS</div>
          <div style={s.savedList}>
            {saved.map(cfg => (
              <div key={cfg.id} style={{ ...s.savedItem, borderColor: cfg.active ? 'var(--blue)' : 'var(--border)' }}>
                <div style={s.savedDot(cfg.active)} />
                <div style={s.savedInfo}>
                  <div style={s.savedLabel}>{cfg.label}</div>
                  <div style={s.savedHost}>{cfg.host}:{cfg.port}</div>
                </div>
                {!cfg.active && (
                  <button style={s.btnActivate} onClick={() => handleActivate(cfg.id)}>Ativar</button>
                )}
                {cfg.active && <span style={s.activeBadge}>Ativo</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!connected && !showForm && saved.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>⬡</div>
          <div style={s.emptyTitle}>Nenhum MikroTik configurado</div>
          <div style={s.emptySub}>Adicione um roteador para começar a gerenciar sua rede</div>
          <button style={s.btnPrimary} onClick={() => setShowForm(true)}>+ Adicionar MikroTik</button>
        </div>
      )}

      {/* Painel de ações */}
      {connected && !showForm && (
        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.cardLabel}>AÇÕES</div>
            <div style={s.actions}>
              {actions.map(({ label, fn }) => (
                <button key={label} style={{ ...s.actionBtn, opacity: loading ? .5 : 1 }}
                  onClick={fn} disabled={!!loading}>
                  <span style={s.actionDot} />{label}
                </button>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>STATUS</div>
            {status ? (
              <div style={s.statusGrid}>
                {Object.entries(status).slice(0, 8).map(([k, v]) => (
                  <div key={k} style={s.statusRow}>
                    <span style={s.statusKey}>{k}</span>
                    <span style={s.statusVal}>{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : <div style={s.emptyText}>Execute "Status do dispositivo"</div>}
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>INTERFACES ({interfaces.length})</div>
            {interfaces.map((iface, i) => (
              <div key={i} style={s.ifaceRow}>
                <div style={{ width:6, height:6, borderRadius:'50%', background: iface.running === 'true' ? 'var(--success)' : 'var(--gray-3)', flexShrink:0 }} />
                <span style={s.ifaceName}>{iface.name}</span>
                <span style={s.ifaceType}>{iface.type}</span>
              </div>
            ))}
            {interfaces.length === 0 && <div style={s.emptyText}>Execute "Listar interfaces"</div>}
          </div>

          <div style={{ ...s.card, gridColumn:'1/-1' }}>
            <div style={s.cardLabel}>LOG</div>
            <div style={s.terminal}>
              {log.length === 0 && <span style={{ color:'var(--gray-3)' }}>Aguardando...</span>}
              {log.map((e, i) => (
                <div key={i} style={{ color: logColor[e.type] }}>
                  <span style={{ color:'var(--gray-3)' }}>[{e.ts}]</span> {e.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { flex:1, overflowY:'auto', padding:'28px 32px', background:'var(--black)' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' },
  headerLeft: { display:'flex', alignItems:'center', gap:12 },
  dot: { width:10, height:10, borderRadius:'50%', flexShrink:0 },
  headerTitle: { fontWeight:600, fontSize:16, color:'var(--white)', letterSpacing:'-.01em' },
  headerSub: { fontSize:12, color:'var(--gray-2)', marginTop:2 },
  btnPrimary: { background:'var(--blue)', color:'#fff', border:'none', borderRadius:'var(--r)', padding:'8px 16px', fontFamily:'var(--sans)', fontSize:12, fontWeight:500, cursor:'pointer' },
  btnDanger: { background:'transparent', color:'var(--danger)', border:'1px solid rgba(229,57,53,.3)', borderRadius:'var(--r)', padding:'8px 16px', fontFamily:'var(--sans)', fontSize:12, cursor:'pointer' },
  formCard: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:20, marginBottom:20 },
  formTitle: { fontSize:13, fontWeight:600, color:'var(--white)', marginBottom:16 },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  field: { display:'flex', flexDirection:'column', gap:5 },
  label: { fontSize:10, fontWeight:500, color:'var(--gray-2)', letterSpacing:'.06em', textTransform:'uppercase' },
  input: { background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r)', padding:'9px 12px', color:'var(--white)', fontFamily:'var(--sans)', fontSize:13, outline:'none' },
  savedSection: { marginBottom:20 },
  sectionLabel: { fontSize:10, fontWeight:500, color:'var(--gray-3)', letterSpacing:'.08em', marginBottom:10 },
  savedList: { display:'flex', flexDirection:'column', gap:8 },
  savedItem: { display:'flex', alignItems:'center', gap:12, background:'var(--elevated)', border:'1px solid', borderRadius:'var(--r)', padding:'12px 16px' },
  savedDot: (active) => ({ width:8, height:8, borderRadius:'50%', background: active ? 'var(--success)' : 'var(--gray-3)', flexShrink:0 }),
  savedInfo: { flex:1 },
  savedLabel: { fontSize:13, fontWeight:500, color:'var(--white)' },
  savedHost: { fontSize:11, color:'var(--gray-2)', fontFamily:'var(--mono)', marginTop:2 },
  btnActivate: { background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r)', padding:'5px 12px', color:'var(--gray-1)', fontFamily:'var(--sans)', fontSize:11, cursor:'pointer' },
  activeBadge: { fontSize:10, fontWeight:500, color:'var(--success)', background:'rgba(39,174,96,.1)', padding:'3px 10px', borderRadius:20 },
  empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:12, textAlign:'center' },
  emptyIcon: { fontSize:40, color:'var(--gray-3)', marginBottom:4 },
  emptyTitle: { fontSize:16, fontWeight:600, color:'var(--white)' },
  emptySub: { fontSize:13, color:'var(--gray-2)', maxWidth:340, lineHeight:1.6, marginBottom:4 },
  emptyText: { fontSize:11, color:'var(--gray-3)' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  card: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:18 },
  cardLabel: { fontSize:9, fontWeight:600, color:'var(--gray-3)', letterSpacing:'.12em', marginBottom:14 },
  actions: { display:'flex', flexDirection:'column', gap:8 },
  actionBtn: { display:'flex', alignItems:'center', gap:10, background:'var(--surface)', border:'1px solid var(--border-2)', borderRadius:'var(--r)', padding:'10px 14px', color:'var(--gray-1)', fontFamily:'var(--sans)', fontSize:12, cursor:'pointer', textAlign:'left' },
  actionDot: { width:5, height:5, borderRadius:'50%', background:'var(--blue)', flexShrink:0 },
  statusGrid: { display:'flex', flexDirection:'column', gap:8 },
  statusRow: { display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)' },
  statusKey: { fontSize:11, color:'var(--gray-2)' },
  statusVal: { fontSize:11, color:'var(--blue)', fontFamily:'var(--mono)', fontWeight:500 },
  ifaceRow: { display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' },
  ifaceName: { fontSize:12, fontWeight:500, color:'var(--white)', flex:1 },
  ifaceType: { fontSize:10, color:'var(--gray-3)' },
  terminal: { background:'var(--black)', borderRadius:'var(--r)', padding:12, fontFamily:'var(--mono)', fontSize:11, lineHeight:1.8, height:150, overflowY:'auto', display:'flex', flexDirection:'column-reverse' },
};

import { useState } from 'react';
import { mikrotikService } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Card = ({ label, value, sub, accent, loading }) => (
  <div style={s.card}>
    <div style={s.cardLabel}>{label}</div>
    <div style={{ ...s.cardValue, color: accent || 'var(--white)' }}>
      {loading ? <span style={s.shimmer}>···</span> : value}
    </div>
    {sub && <div style={s.cardSub}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'superadmin';
  const [data, setData]       = useState(null);
  const [ifaces, setIfaces]   = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const statusUrl    = isAdmin ? '/api/mikrotik/status'     : '/api/mikrotik/status/view';
      const interfaceUrl = isAdmin ? '/api/mikrotik/interfaces' : '/api/mikrotik/interfaces/view';
      const [st, if_] = await Promise.allSettled([
        api.get(statusUrl),
        api.get(interfaceUrl),
      ]);
      if (st.status === 'fulfilled')  setData(st.value.data);
      if (if_.status === 'fulfilled') setIfaces(if_.value.data);
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <div style={s.pageTitle}>Monitoramento de Rede</div>
          <div style={s.pageSub}>Visão geral do dispositivo MikroTik</div>
        </div>
        <button style={s.refreshBtn} onClick={refresh} disabled={loading}>
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" style={{ marginRight:6, opacity:.7 }}>
            <path d="M1.5 7.5a6 6 0 1110.5-4M12 1v3H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div style={s.grid}>
        <Card label="Uptime" value={data?.uptime || '—'} sub="Tempo online" loading={loading && !data} />
        <Card label="Versão RouterOS" value={data?.version?.split(' ')[0] || '—'} sub="Sistema operacional" loading={loading && !data} />
        <Card label="CPU" value={data?.['cpu-load'] ? data['cpu-load'] + '%' : '—'} accent="var(--blue)" sub="Uso do processador" loading={loading && !data} />
        <Card label="Memória livre" value={data?.['free-memory'] ? Math.round(parseInt(data['free-memory'])/1024/1024) + ' MB' : '—'} sub="RAM disponível" loading={loading && !data} />
        <Card label="Interfaces" value={ifaces ? ifaces.length : '—'} sub="Interfaces configuradas" loading={loading && !ifaces} />
        <Card label="Interfaces ativas" value={ifaces ? ifaces.filter(i => i.running === 'true').length : '—'} accent="var(--success)" sub="Com link ativo" loading={loading && !ifaces} />
      </div>

      {ifaces && ifaces.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Interfaces</div>
          <div style={s.ifaceGrid}>
            {ifaces.map((iface, i) => (
              <div key={i} style={s.ifaceCard}>
                <div style={s.ifaceTop}>
                  <div style={{ ...s.ifaceStatus, background: iface.running === 'true' ? 'var(--success)' : 'var(--gray-3)' }} />
                  <span style={s.ifaceName}>{iface.name}</span>
                  <span style={s.ifaceType}>{iface.type}</span>
                </div>
                {iface['mac-address'] && <div style={s.ifaceMac}>{iface['mac-address']}</div>}
                {iface.comment && <div style={s.ifaceComment}>{iface.comment}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="var(--gray-3)" strokeWidth="1.2"/>
              <path d="M7.5 4v4M7.5 10v.5" stroke="var(--gray-3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={s.emptyText}>Clique em "Atualizar" para carregar os dados do MikroTik</div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { flex:1, overflowY:'auto', padding:'28px 32px', background:'var(--black)' },
  topbar: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 },
  pageTitle: { fontFamily:'var(--sans)', fontWeight:600, fontSize:20, color:'var(--white)', letterSpacing:'-.02em', marginBottom:3 },
  pageSub: { fontSize:12, color:'var(--gray-2)' },
  refreshBtn: {
    display:'flex', alignItems:'center',
    background:'var(--elevated)', border:'1px solid var(--border-2)',
    borderRadius:'var(--r)', padding:'7px 14px',
    color:'var(--gray-1)', fontFamily:'var(--sans)', fontSize:12,
    cursor:'pointer', transition:'border-color .15s',
  },
  grid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 },
  card: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'18px 20px' },
  cardLabel: { fontSize:11, color:'var(--gray-2)', marginBottom:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em' },
  cardValue: { fontSize:24, fontWeight:600, letterSpacing:'-.02em', marginBottom:4 },
  cardSub: { fontSize:11, color:'var(--gray-3)' },
  shimmer: { animation:'shimmer 1.2s ease-in-out infinite', color:'var(--gray-3)' },
  section: { marginTop:4 },
  sectionTitle: { fontSize:11, fontWeight:500, color:'var(--gray-2)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 },
  ifaceGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 },
  ifaceCard: { background:'var(--elevated)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px' },
  ifaceTop: { display:'flex', alignItems:'center', gap:8, marginBottom:6 },
  ifaceStatus: { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  ifaceName: { fontSize:12, fontWeight:500, color:'var(--white)', flex:1 },
  ifaceType: { fontSize:10, color:'var(--gray-3)' },
  ifaceMac: { fontSize:10, color:'var(--gray-3)', fontFamily:'var(--mono)' },
  ifaceComment: { fontSize:11, color:'var(--blue)', marginTop:3 },
  empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:12, textAlign:'center' },
  emptyIcon: { opacity:.4 },
  emptyText: { fontSize:13, color:'var(--gray-2)', maxWidth:300 },
};

import { useAuth } from '../context/AuthContext';

const NAV_ADMIN = [
  { id:'dashboard', label:'Dashboard',   icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { id:'chat',      label:'Chat IA',     icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 3a1 1 0 011-1h9a1 1 0 011 1v7a1 1 0 01-1 1H8l-3 2v-2H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { id:'mikrotik',  label:'Roteadores',  icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7.5 2v5.5L11 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { id:'backups',   label:'Backups',     icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5 7.5h5M7.5 5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/></svg> },
];

const NAV_USER = [
  { id:'dashboard', label:'Dashboard',   icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg> },
  { id:'chat',      label:'Chat IA',     icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 3a1 1 0 011-1h9a1 1 0 011 1v7a1 1 0 01-1 1H8l-3 2v-2H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2"/></svg> },
];

export default function Sidebar({ view, setView }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'superadmin';
  const NAV = isAdmin ? NAV_ADMIN : NAV_USER;

  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <div style={s.logoWrap}>
          <img src="/logo.png" alt="logo" style={s.logo} />
        </div>
        <div>
          <div style={s.brandName}>MikroTik AI</div>
          <div style={s.brandRole}>{user?.role === 'superadmin' ? 'Administrador' : 'Usuário'}</div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionLabel}>Menu</div>
        <nav style={s.nav}>
          {NAV.map(item => (
            <button key={item.id} style={{ ...s.navBtn, ...(view === item.id ? s.navActive : {}) }}
              onClick={() => setView(item.id)}>
              <span style={{ ...s.navIcon, color: view === item.id ? 'var(--blue)' : 'var(--gray-3)' }}>
                {item.icon}
              </span>
              <span style={{ color: view === item.id ? 'var(--white)' : 'var(--gray-2)' }}>
                {item.label}
              </span>
              {view === item.id && <div style={s.activeBar} />}
            </button>
          ))}
        </nav>
      </div>

      <div style={s.spacer} />

      <div style={s.footer}>
        <div style={s.userCard}>
          <div style={s.userAvatar}>{user?.username?.[0]?.toUpperCase()}</div>
          <div style={s.userInfo}>
            <div style={s.userName}>{user?.username}</div>
            <div style={s.userRole}>{user?.role}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={logout} title="Sair">
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-2.5L10 5M13 7.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width:220, minWidth:220, height:'100vh',
    background:'var(--surface)', borderRight:'1px solid var(--border)',
    display:'flex', flexDirection:'column', padding:'20px 12px',
  },
  brand: { display:'flex', alignItems:'center', gap:10, padding:'4px 8px 24px', marginBottom:4 },
  logoWrap: { width:30, height:30, borderRadius:7, overflow:'hidden', flexShrink:0 },
  logo: { width:'100%', height:'100%', objectFit:'cover' },
  brandName: { fontWeight:600, fontSize:13, color:'var(--white)', letterSpacing:'-.01em' },
  brandRole: { fontSize:10, color:'var(--gray-3)', marginTop:1 },
  section: { flex:1 },
  sectionLabel: { fontSize:10, fontWeight:500, color:'var(--gray-3)', letterSpacing:'.08em', textTransform:'uppercase', padding:'0 8px', marginBottom:6 },
  nav: { display:'flex', flexDirection:'column', gap:1 },
  navBtn: {
    display:'flex', alignItems:'center', gap:9,
    padding:'8px 10px', borderRadius:'var(--r)',
    background:'transparent', border:'none',
    fontFamily:'var(--sans)', fontSize:13, fontWeight:400,
    cursor:'pointer', width:'100%', textAlign:'left',
    position:'relative', transition:'background .12s',
  },
  navActive: { background:'rgba(47,128,237,.08)' },
  navIcon: { flexShrink:0, display:'flex', alignItems:'center' },
  activeBar: { position:'absolute', right:0, top:'20%', bottom:'20%', width:2, background:'var(--blue)', borderRadius:2 },
  spacer: { flex:1 },
  footer: { borderTop:'1px solid var(--border)', paddingTop:14, display:'flex', alignItems:'center', gap:8 },
  userCard: { flex:1, display:'flex', alignItems:'center', gap:8, minWidth:0 },
  userAvatar: {
    width:28, height:28, borderRadius:7,
    background:'var(--blue-soft)', color:'var(--blue)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11, fontWeight:600, flexShrink:0,
  },
  userInfo: { minWidth:0 },
  userName: { fontSize:12, fontWeight:500, color:'var(--white)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userRole: { fontSize:10, color:'var(--gray-3)' },
  logoutBtn: { background:'transparent', border:'none', color:'var(--gray-3)', cursor:'pointer', padding:4, borderRadius:4, display:'flex', flexShrink:0, transition:'color .15s' },
};

// BottomNav.jsx — glass liquid bottom navigation with 6 items
function NavIcon({ name, active }) {
  const color = active ? '#C8FF00' : 'rgba(232,240,228,0.48)';
  const stroke = active ? 2.4 : 1.7;
  const filter = active ? 'drop-shadow(0 0 5px rgba(200,255,0,0.55))' : 'none';
  const icons = {
    home: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    map: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></>,
    feed: <><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/></>,
    user: <><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></>,
  };
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ filter }}>
      {icons[name]}
    </svg>
  );
}

function BottomNav({ active, onChange }) {
  const items = [
    { key: 'home', label: 'Inicio', icon: 'home' },
    { key: 'explorar', label: 'Explorar', icon: 'search' },
    { key: 'mapa', label: 'Mapa', icon: 'map' },
    { key: 'feed', label: 'Feed', icon: 'feed' },
    { key: 'torneos', label: 'Torneos', icon: 'trophy' },
    { key: 'perfil', label: 'Perfil', icon: 'user' },
  ];
  return (
    <nav style={{
      position: 'absolute', bottom: 16, left: 12, right: 12, zIndex: 50,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 4px', borderRadius: 30,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.04) 100%)',
      backdropFilter: 'blur(52px) saturate(220%) brightness(1.15)',
      WebkitBackdropFilter: 'blur(52px) saturate(220%) brightness(1.15)',
      border: '1px solid rgba(255,255,255,0.26)', borderTopColor: 'rgba(255,255,255,0.42)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.3)',
    }}>
      {items.map(it => {
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange(it.key)} style={{
            background: isActive ? 'linear-gradient(160deg, rgba(200,255,0,0.22), rgba(200,255,0,0.1))' : 'transparent',
            border: isActive ? '1px solid rgba(200,255,0,0.3)' : '1px solid transparent',
            borderRadius: 18, padding: '6px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            cursor: 'pointer', boxShadow: isActive ? 'inset 0 1px 0 rgba(200,255,0,0.3), 0 0 16px rgba(200,255,0,0.12)' : 'none',
          }}>
            <NavIcon name={it.icon} active={isActive}/>
            <span style={{
              fontSize: 9.5, fontFamily: 'Inter', fontWeight: isActive ? 700 : 500,
              color: isActive ? '#C8FF00' : 'rgba(232,240,228,0.42)',
            }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

window.BottomNav = BottomNav;

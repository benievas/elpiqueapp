// ExplorarScreen.jsx
const DEPORTES = ['Todos', 'Fútbol', 'Padel', 'Tenis', 'Vóley', 'Básquet'];
const COMPLEJOS = [
  { slug: 'sportivo-central', nombre: 'Sportivo Central', deporte: 'Fútbol', dir: 'Av. Belgrano 1240', rating: 4.8, reviews: 124, img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800' },
  { slug: 'padel-club-elite', nombre: 'Padel Club Elite', deporte: 'Padel', dir: 'Ruta 38 km 4', rating: 4.9, reviews: 48, img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800' },
  { slug: 'arena-voley', nombre: 'Arena Vóley Catamarca', deporte: 'Vóley', dir: 'Pje. Sarmiento 220', rating: 4.6, reviews: 32, img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800' },
  { slug: 'tenis-club-norte', nombre: 'Tenis Club', deporte: 'Tenis', dir: 'Av. Güemes 820', rating: 4.7, reviews: 56, img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800' },
];

function ExplorarScreen({ onOpenComplejo }) {
  const [q, setQ] = React.useState('');
  const [dep, setDep] = React.useState('Todos');
  const filtered = COMPLEJOS.filter(c =>
    (dep === 'Todos' || c.deporte === dep) &&
    c.nombre.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'linear-gradient(160deg,#040D07,#081810)', color: '#E8F0E4' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, padding: '56px 20px 14px', background: 'rgba(4,13,7,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8F0E4" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <h1 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 18, letterSpacing: '0.02em', color: '#fff', margin: 0, textTransform: 'uppercase' }}>Explorar Complejos</h1>
        <div style={{ width: 36 }}/>
      </header>

      <div style={{ padding: '16px 20px 120px' }}>
        {/* City pill */}
        <div style={{ marginBottom: 14 }}>
          <button style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C8FF00' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Catamarca</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(232,240,228,0.4)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en Catamarca..."
            style={{ width: '100%', padding: '12px 12px 12px 38px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#E8F0E4', fontSize: 13, fontFamily: 'Inter', outline: 'none', boxSizing: 'border-box' }}/>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {DEPORTES.map(d => (
            <button key={d} onClick={() => setDep(d)} style={{
              padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: dep === d ? '#C8FF00' : 'rgba(255,255,255,0.05)',
              color: dep === d ? '#040D07' : '#E8F0E4',
              border: dep === d ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
            }}>{d}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(c => (
            <div key={c.slug} onClick={() => onOpenComplejo(c.slug)} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
            }}>
              <div style={{ position: 'relative', height: 140, background: `url(${c.img}) center/cover` }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,13,7,0.9), transparent 50%)' }}/>
                <span style={{ position: 'absolute', top: 10, right: 10, padding: '4px 9px', borderRadius: 8, background: 'rgba(200,255,0,0.2)', border: '1px solid rgba(200,255,0,0.4)', color: '#C8FF00', fontSize: 10, fontWeight: 700 }}>{c.deporte.toUpperCase()}</span>
                <span style={{ position: 'absolute', bottom: 10, left: 10, padding: '3px 9px', borderRadius: 8, background: 'rgba(0,230,118,0.2)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676', fontSize: 10, fontWeight: 700 }}>● ABIERTO</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: 'rgba(232,240,228,0.5)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                  {c.dir}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#FFD600', fontSize: 11, letterSpacing: 1 }}>★★★★★</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{c.rating}</span>
                  <span style={{ fontSize: 11, color: 'rgba(232,240,228,0.4)' }}>({c.reviews})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ExplorarScreen = ExplorarScreen;

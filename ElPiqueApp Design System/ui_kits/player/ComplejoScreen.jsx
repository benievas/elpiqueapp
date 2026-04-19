// ComplejoScreen.jsx — detail + booking
const COMPLEJOS_DB = {
  'sportivo-central': {
    nombre: 'Sportivo Central', deporte: 'Fútbol', dir: 'Av. Belgrano 1240, Catamarca',
    rating: 4.8, reviews: 124, img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200',
    desc: 'Complejo deportivo profesional con 8 canchas de fútbol sintético, padel y vóley. Infraestructura de primera.',
    horario: '08:00 – 00:00',
    canchas: [
      { id: 1, nombre: 'Cancha 1', tipo: 'Fútbol 5', precio: 18000, superficie: 'Sintético' },
      { id: 2, nombre: 'Cancha 2', tipo: 'Fútbol 5', precio: 18000, superficie: 'Sintético' },
      { id: 3, nombre: 'Cancha 11', tipo: 'Fútbol 11', precio: 45000, superficie: 'Sintético' },
    ],
  },
  'padel-club-elite': {
    nombre: 'Padel Club Elite', deporte: 'Padel', dir: 'Ruta 38 km 4, Catamarca',
    rating: 4.9, reviews: 48, img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200',
    desc: 'Iluminación LED profesional para juegos nocturnos. Área de espera climatizada y cafetería.',
    horario: '09:00 – 23:00',
    canchas: [
      { id: 1, nombre: 'Cancha A', tipo: 'Padel', precio: 12000, superficie: 'Césped sintético' },
      { id: 2, nombre: 'Cancha B', tipo: 'Padel', precio: 12000, superficie: 'Césped sintético' },
    ],
  },
  'arena-voley': {
    nombre: 'Arena Vóley Catamarca', deporte: 'Vóley', dir: 'Pje. Sarmiento 220, Catamarca',
    rating: 4.6, reviews: 32, img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1200',
    desc: 'Estadio con 4 canchas profesionales de vóley. Capacidad para ligas y torneos.',
    horario: '07:00 – 23:00',
    canchas: [
      { id: 1, nombre: 'Cancha 1', tipo: 'Vóley', precio: 8000, superficie: 'Parquet' },
    ],
  },
  'tenis-club-norte': {
    nombre: 'Tenis Club Catamarca', deporte: 'Tenis', dir: 'Av. Güemes 820',
    rating: 4.7, reviews: 56, img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200',
    desc: 'Canchas de polvo de ladrillo y cemento.',
    horario: '07:00 – 22:00',
    canchas: [
      { id: 1, nombre: 'Central', tipo: 'Tenis', precio: 9000, superficie: 'Polvo de ladrillo' },
    ],
  },
};

function ComplejoScreen({ slug, onBack, onBook }) {
  const c = COMPLEJOS_DB[slug] || COMPLEJOS_DB['sportivo-central'];
  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: '#040D07', color: '#E8F0E4', paddingBottom: 100 }}>
      {/* Hero image */}
      <div style={{ position: 'relative', height: 280 }}>
        <img src={c.img} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #040D07 0%, rgba(4,13,7,0.2) 40%, rgba(0,0,0,0.5) 100%)' }}/>
        <button onClick={onBack} style={{ position: 'absolute', top: 56, left: 20, width: 40, height: 40, borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button style={{ position: 'absolute', top: 56, right: 20, width: 40, height: 40, borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
        </button>
      </div>

      {/* Title block */}
      <div style={{ padding: '16px 20px 0', marginTop: -30, position: 'relative' }}>
        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 8, background: 'rgba(200,255,0,0.2)', border: '1px solid rgba(200,255,0,0.4)', color: '#C8FF00', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>{c.deporte.toUpperCase()}</span>
        <h1 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#fff', margin: '10px 0 6px' }}>{c.nombre}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(232,240,228,0.6)' }}>
          <span style={{ color: '#FFD600' }}>★</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>{c.rating}</span>
          <span>({c.reviews})</span>
          <span>·</span>
          <span style={{ color: '#00E676' }}>● Abierto</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(232,240,228,0.5)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
          {c.dir}
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(232,240,228,0.75)', marginTop: 14 }}>{c.desc}</p>
      </div>

      {/* Canchas */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.4)', marginBottom: 12 }}>Canchas disponibles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {c.canchas.map(q => (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{q.nombre}</div>
                <div style={{ fontSize: 11, color: 'rgba(232,240,228,0.5)', marginTop: 2 }}>{q.tipo} · {q.superficie}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 18, color: '#C8FF00', marginTop: 6 }}>${q.precio.toLocaleString('es-AR')}<span style={{ fontSize: 11, color: 'rgba(232,240,228,0.4)', fontWeight: 400 }}> /hr</span></div>
              </div>
              <button onClick={() => onBook(q)} style={{ padding: '10px 14px', borderRadius: 22, background: 'linear-gradient(135deg,#C8FF00,#A8D800)', color: '#040D07', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', boxShadow: '0 4px 20px rgba(200,255,0,0.35)' }}>Reservar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ComplejoScreen = ComplejoScreen;

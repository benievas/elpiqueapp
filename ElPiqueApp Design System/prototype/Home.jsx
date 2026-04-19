// Home.jsx — iOS 26 Liquid Glass Home / Landing
const PROMO_SLIDES = [
  {
    id: 'p1', isPromo: true,
    title: 'RESERVÁ EN SEGUNDOS', subtitle: 'CONFIRMACIÓN VÍA WHATSAPP',
    desc: 'Elegí la cancha, seleccioná el horario disponible y confirmá con el dueño directo por WhatsApp. Sin apps extra, sin esperas.',
    bg: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000',
    cta: 'Explorar canchas', link: 'explorar',
  },
  {
    id: 'c1', isPromo: false,
    title: 'SPORTIVO CENTRAL', subtitle: 'FÚTBOL / MULTIDEPORTE',
    desc: 'Complejo profesional con 8 canchas de fútbol sintético, padel y vóley. Infraestructura de primera, vestuarios y estacionamiento.',
    bg: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000',
    cta: 'Reservar cancha', link: 'complejo',
  },
  {
    id: 'p2', isPromo: true,
    title: 'TORNEOS Y LIGAS', subtitle: 'COMPETÍ CON TU EQUIPO',
    desc: 'Anotate en torneos activos en tu ciudad. Seguí el bracket, resultados y clasificaciones. Organización completa, gratis para jugadores.',
    bg: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?q=80&w=2000',
    cta: 'Ver torneos', link: 'torneos',
  },
  {
    id: 'c2', isPromo: false,
    title: 'PADEL CLUB ELITE', subtitle: 'PADEL / TENIS',
    desc: 'Iluminación LED profesional para juegos nocturnos y área de espera climatizada. Dos canchas de césped sintético de última generación.',
    bg: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000',
    cta: 'Reservar cancha', link: 'complejo',
  },
];

const FEATURED = [
  { slug: 'sportivo-central', nombre: 'Sportivo Central', cat: 'Fútbol 5/11', rating: 4.8, reviews: 124, img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800' },
  { slug: 'padel-club-elite', nombre: 'Padel Club Elite', cat: 'Padel', rating: 4.9, reviews: 48, img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800' },
  { slug: 'arena-voley', nombre: 'Arena Vóley', cat: 'Vóley', rating: 4.6, reviews: 32, img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800' },
  { slug: 'tenis-club-norte', nombre: 'Tenis Club', cat: 'Tenis', rating: 4.7, reviews: 56, img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800' },
];

const ACCESO_RAPIDO = [
  { icon: 'Compass', title: 'Explorar Complejos', desc: 'Descubrí todos los complejos deportivos', to: 'explorar' },
  { icon: 'Map', title: 'Mapa de Canchas', desc: 'Ubicación de complejos en Catamarca', to: 'mapa' },
  { icon: 'Trophy', title: 'Torneos', desc: 'Participá en torneos activos', to: 'torneos' },
];

const STATS = [
  { v: '12', u: '+', d: 'Complejos disponibles' },
  { v: '45', u: '+', d: 'Canchas regulares' },
  { v: '8', u: '', d: 'Deportes diferentes' },
  { v: '24/7', u: '', d: 'Reservas abiertas' },
];

function HomeScreen({ onNavigate, scrollRef }) {
  const [idx, setIdx] = React.useState(0);
  const slide = PROMO_SLIDES[idx];

  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PROMO_SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="screen" ref={scrollRef}>
      {/* HERO */}
      <section className="hero">
        <span className="eyebrow" style={{ color: 'rgba(232,240,228,0.8)', marginBottom: 4 }}>{slide.subtitle}</span>
        <h1 key={slide.id} style={{ animation: 'fadeSlideUp 600ms cubic-bezier(0.34, 1.3, 0.64, 1)' }}>{slide.title}</h1>
        <p>{slide.desc}</p>
        <div className="hero-actions">
          <button className="btn btn-lime" onClick={() => onNavigate(slide.link)}>
            {slide.cta} <I.Arrow width="12" height="12"/>
          </button>
          <button className="btn btn-glass" onClick={() => onNavigate('mapa')}>
            <I.Map width="12" height="12"/> Ver mapa
          </button>
        </div>

        <div className="slide-dots">
          {PROMO_SLIDES.map((_, i) => (
            <button key={i} className={`d ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}/>
          ))}
        </div>
        <div className="hero-counter">0{idx + 1}</div>
      </section>

      {/* ACCESO RÁPIDO */}
      <section className="section">
        <div className="section-head-row">
          <h2><span className="slash">/</span>Acceso Rápido</h2>
        </div>
        <div className="access-grid">
          {ACCESO_RAPIDO.map((a, i) => {
            const Icon = I[a.icon];
            return (
              <div key={i} className="glass access-card" onClick={() => onNavigate(a.to)}>
                <div className="icon-wrap"><Icon width="20" height="20"/></div>
                <h4>{a.title}</h4>
                <p>{a.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* STATS */}
      <section className="section">
        <div className="section-head-row">
          <h2><span className="slash">/</span>ElPiqueApp en números</h2>
        </div>
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="glass stat-card">
              <div className="v">{s.v}<span className="unit">{s.u}</span></div>
              <div className="d">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPLEJOS DESTACADOS */}
      <section className="section" style={{ paddingRight: 0, paddingBottom: 10 }}>
        <div className="section-head-row" style={{ paddingRight: 28 }}>
          <h2><span className="slash">/</span>Complejos destacados</h2>
          <button className="pill pill-outline" onClick={() => onNavigate('explorar')} style={{ cursor: 'pointer' }}>Ver todos →</button>
        </div>
      </section>
      <div className="rail">
        {FEATURED.map((c, i) => (
          <div key={i} className="glass complejo-card" onClick={() => onNavigate('complejo', c.slug)}>
            <div className="photo" style={{ backgroundImage: `url(${c.img})` }}>
              <span className="pill pill-lime top-right">{c.cat}</span>
              <span className="pill pill-open bottom-left"><span className="dot"/>Abierto</span>
            </div>
            <div className="body">
              <h3>{c.nombre}</h3>
              <div className="addr"><I.Pin width="10" height="10"/>Catamarca · 2,4 km</div>
              <div className="foot">
                <div className="rating">
                  <span className="stars">★★★★★</span>
                  <span className="score">{c.rating}</span>
                  <span className="count">({c.reviews})</span>
                </div>
                <button className="btn btn-lime" style={{ padding: '6px 12px', fontSize: 10 }}>Reservar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VENTAJAS */}
      <section className="section">
        <div className="section-head-row">
          <h2><span className="slash">/</span>¿Por qué ElPiqueApp?</h2>
        </div>
        <div className="access-grid">
          <div className="glass access-card">
            <div className="icon-wrap"><I.Compass width="20" height="20"/></div>
            <h4>Fácil Reserva</h4>
            <p>Buscá, seleccioná tu horario y confirmá en WhatsApp en menos de 2 minutos.</p>
          </div>
          <div className="glass access-card">
            <div className="icon-wrap"><I.Pin width="20" height="20"/></div>
            <h4>Ubicación Inteligente</h4>
            <p>Filtrá por deporte, horario y disponibilidad. Mapa interactivo de todos los complejos.</p>
          </div>
          <div className="glass access-card">
            <div className="icon-wrap"><I.Star width="20" height="20"/></div>
            <h4>Reseñas Verificadas</h4>
            <p>Leé opiniones de otros jugadores y calificá cada cancha después de jugar.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL — Owner */}
      <section className="section">
        <div className="glass glass-tinted" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <span className="eyebrow" style={{ color: 'var(--rodeo-lime)' }}>¿Sos dueño de un complejo?</span>
          <h3 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 36, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#fff', margin: 0, lineHeight: 0.95 }}>Digitalizá tu cancha<br/>en 2 minutos</h3>
          <p style={{ color: 'rgba(232,240,228,0.8)', fontSize: 13, lineHeight: 1.55, margin: 0, maxWidth: 480 }}>Gestioná reservas, clientes y estadísticas desde un solo panel. Compartí tu link público y dejá que los jugadores reserven solos.</p>
          <button className="btn btn-lime">Crear mi cuenta gratis <I.Arrow width="12" height="12"/></button>
        </div>
      </section>
    </div>
  );
}

window.HomeScreen = HomeScreen;

// HomeScreen.jsx — hero full-bleed slider + featured
const HOME_SLIDES = [
  {
    id: 1, title: 'RESERVÁ EN SEGUNDOS', subtitle: 'CONFIRMACIÓN VÍA WHATSAPP',
    desc: 'Elegí la cancha, seleccioná el horario disponible y confirmá con el dueño directo por WhatsApp.',
    bg: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1600',
    cta: 'Explorar canchas',
  },
  {
    id: 2, title: 'SPORTIVO CENTRAL', subtitle: 'FÚTBOL / MULTIDEPORTE',
    desc: 'Complejo profesional con 8 canchas de fútbol sintético, padel y vóley.',
    bg: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600',
    cta: 'Reservar cancha',
  },
  {
    id: 3, title: 'PADEL CLUB ELITE', subtitle: 'PADEL / TENIS',
    desc: 'Iluminación LED profesional. Área de espera climatizada.',
    bg: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1600',
    cta: 'Reservar cancha',
  },
];

const FEATURED = [
  { name: 'Sportivo Central', cat: 'Fútbol 5/11', rating: 4.8, img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600' },
  { name: 'Padel Club Elite', cat: 'Padel', rating: 4.9, img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=600' },
  { name: 'Arena Vóley', cat: 'Vóley', rating: 4.6, img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=600' },
];

function HomeScreen({ onOpenComplejo }) {
  const [idx, setIdx] = React.useState(0);
  const slide = HOME_SLIDES[idx];
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HOME_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', background: '#040D07', color: '#E8F0E4' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 560, overflow: 'hidden' }}>
        <img src={slide.bg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.8s' }} key={slide.id}/>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}/>
        {/* Header */}
        <div style={{ position: 'absolute', top: 56, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <img src="/projects/current/assets/logo-main.png" alt="" style={{ height: 48, filter: 'drop-shadow(0 0 12px rgba(200,255,0,0.35))' }}
               onError={e => { e.target.src = '../../assets/logo-main.png'; }}/>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: 8, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)', color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button style={{ padding: 8, borderRadius: 12, background: 'rgba(200,255,0,0.18)', border: '1px solid rgba(200,255,0,0.35)', backdropFilter: 'blur(20px)', color: '#C8FF00' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ position: 'absolute', bottom: 100, left: 24, right: 24, zIndex: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.8)', marginBottom: 8 }}>{slide.subtitle}</div>
          <h1 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 42, lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#fff', margin: 0 }}>{slide.title}</h1>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(232,240,228,0.85)', marginTop: 12, marginBottom: 20 }}>{slide.desc}</p>
          <button onClick={() => onOpenComplejo && onOpenComplejo('sportivo-central')}
            style={{ padding: '11px 20px', borderRadius: 22, background: 'linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            {slide.cta}
          </button>
        </div>

        {/* Counter */}
        <div style={{ position: 'absolute', bottom: 30, left: 24, display: 'flex', gap: 10, zIndex: 5 }}>
          {HOME_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 22 : 6, height: 6, borderRadius: 3,
              background: i === idx ? '#C8FF00' : 'rgba(255,255,255,0.4)', border: 'none',
              transition: 'all 0.3s',
            }}/>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 18, right: 24, fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 48, color: 'rgba(255,255,255,0.2)', letterSpacing: '-0.02em', lineHeight: 1 }}>0{idx + 1}</div>
      </section>

      {/* Stats */}
      <section style={{ padding: '24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.4)', marginBottom: 14 }}>ElPiqueApp en Números</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { v: '12+', d: 'Complejos' },
            { v: '45+', d: 'Canchas' },
            { v: '8', d: 'Deportes' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'rgba(232,240,228,0.5)', marginTop: 4 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: '24px 0 120px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 22, letterSpacing: '-0.01em', textTransform: 'uppercase', color: '#fff', margin: '0 20px 14px' }}>Complejos Destacados</h2>
        <div style={{ display: 'flex', gap: 12, padding: '0 20px', overflowX: 'auto' }}>
          {FEATURED.map((c, i) => (
            <div key={i} onClick={() => onOpenComplejo && onOpenComplejo('padel-club-elite')} style={{
              flexShrink: 0, width: 200, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(40px)', cursor: 'pointer',
            }}>
              <div style={{ height: 120, backgroundImage: `url(${c.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.4)', marginBottom: 4 }}>{c.cat}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: 'rgba(232,240,228,0.6)' }}>
                  <span style={{ color: '#FFD600' }}>★</span>{c.rating}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

window.HomeScreen = HomeScreen;

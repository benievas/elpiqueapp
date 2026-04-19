// BookingModal.jsx — simple date/hour/duration flow → WhatsApp
function BookingModal({ cancha, onClose }) {
  const [hora, setHora] = React.useState('19:00');
  const [dur, setDur] = React.useState(1);
  if (!cancha) return null;
  const horarios = ['18:00', '19:00', '20:00', '21:00', '22:00'];
  const total = cancha.precio * dur;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{
        width: '100%', background: 'linear-gradient(160deg,#0D2016,#040D07)',
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        border: '1px solid rgba(255,255,255,0.12)', borderBottom: 'none',
        padding: 22, paddingBottom: 34, color: '#E8F0E4',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 18px' }}/>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C8FF00', marginBottom: 4 }}>Reservar</div>
        <h2 style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#fff', margin: '0 0 18px' }}>{cancha.nombre}</h2>

        {/* Date pill */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.4)', marginBottom: 8 }}>Fecha</div>
        <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Sábado 25 abr · 2026</div>

        {/* Horario */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.4)', marginBottom: 8 }}>Horario</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          {horarios.map(h => (
            <button key={h} onClick={() => setHora(h)} style={{
              padding: '9px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 15,
              background: h === hora ? '#C8FF00' : 'rgba(255,255,255,0.05)',
              color: h === hora ? '#040D07' : '#E8F0E4',
              border: h === hora ? 'none' : '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
            }}>{h}</button>
          ))}
        </div>

        {/* Duration */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Duración</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setDur(Math.max(1, dur - 1))} style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>−</button>
            <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 20, color: '#C8FF00', minWidth: 40, textAlign: 'center' }}>{dur}h</span>
            <button onClick={() => setDur(Math.min(4, dur + 1))} style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,240,228,0.4)' }}>Total</span>
          <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: '-0.02em' }}>${total.toLocaleString('es-AR')}</span>
        </div>

        {/* WhatsApp CTA */}
        <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 22, background: 'linear-gradient(135deg,#C8FF00,#A8D800)', color: '#040D07', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', boxShadow: '0 4px 24px rgba(200,255,0,0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2 0-.4-.1-.5C9.7 8.5 9 7 8.8 6.5c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5 1.7.7 2.4.8 3.2.7.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4M12 2a10 10 0 0 0-9 14l-1 5 5-1a10 10 0 1 0 5-18z"/></svg>
          Confirmar por WhatsApp
        </button>
      </div>
    </div>
  );
}

window.BookingModal = BookingModal;

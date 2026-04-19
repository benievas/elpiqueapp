// PhoneFrame.jsx — iPhone-style bezel
function PhoneFrame({ children, statusBarColor = 'rgba(255,255,255,0.9)' }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 54, background: '#000',
      padding: 12, boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.08)',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(160deg, #040D07 0%, #081810 100%)',
      }}>
        {/* Status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 47, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', paddingTop: 12, color: statusBarColor,
          fontSize: 15, fontWeight: 600, fontFamily: 'Inter',
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>●●●●</span>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M1 4.5h2v3H1zM4 3h2v4.5H4zM7 1.5h2v6H7zM10 0h2v7.5h-2z" fill="currentColor"/>
            </svg>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="1" y="1" width="18" height="10" rx="2"/>
              <rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor"/>
              <rect x="20" y="4" width="2" height="4" rx="0.5" fill="currentColor"/>
            </svg>
          </div>
        </div>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 34, background: '#000', borderRadius: 20, zIndex: 110,
        }}/>
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

window.PhoneFrame = PhoneFrame;

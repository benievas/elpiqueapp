// App.jsx — main container with tab bar morphing, tweaks panel, video bg
const { useState, useEffect, useRef, useCallback } = React;

const NAV_ITEMS = [
  { key: 'home', icon: 'Home', label: 'Inicio' },
  { key: 'explorar', icon: 'Search', label: 'Explorar' },
  { key: 'mapa', icon: 'Map', label: 'Mapa' },
  { key: 'feed', icon: 'Feed', label: 'Feed' },
  { key: 'torneos', icon: 'Trophy', label: 'Torneos' },
  { key: 'perfil', icon: 'User', label: 'Perfil' },
];

const VIDEOS = {
  football: 'https://cdn.pixabay.com/video/2022/11/05/137832-768701412_large.mp4',
  stadium: 'https://cdn.pixabay.com/video/2019/06/19/24675-343036065_large.mp4',
  padel: 'https://cdn.pixabay.com/video/2024/03/18/203920-924699587_large.mp4',
};

function App() {
  const [screen, setScreen] = useState('home');
  const [slug, setSlug] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [blur, setBlur] = useState(40);
  const [sat, setSat] = useState(180);
  const [radius, setRadius] = useState(30);
  const [motionSpeed, setMotionSpeed] = useState(1);
  const [lightMode, setLightMode] = useState(false);
  const [videoKey, setVideoKey] = useState('football');
  const scrollRef = useRef(null);

  const navigate = useCallback((key, s = null) => {
    setScreen(key);
    setSlug(s);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrolled(false);
  }, []);

  // scroll listener for morphing nav + specular motion
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      setScrollY(y);
      setScrolled(y > 80);
      // move specular highlight angle based on scroll
      const angle = 160 + (y % 400) / 400 * 40;
      document.documentElement.style.setProperty('--shine-angle', `${angle}deg`);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [screen]);

  // tweaks → css vars
  useEffect(() => {
    document.documentElement.style.setProperty('--blur', `${blur}px`);
    document.documentElement.style.setProperty('--sat', `${sat}%`);
    document.documentElement.style.setProperty('--radius-liquid-lg', `${radius}px`);
  }, [blur, sat, radius]);

  useEffect(() => {
    document.body.classList.toggle('light', lightMode);
  }, [lightMode]);

  return (
    <>
      {/* Background video */}
      <video id="bg-video" key={videoKey} autoPlay muted loop playsInline>
        <source src={VIDEOS[videoKey]} type="video/mp4"/>
      </video>
      <div id="bg-overlay"/>
      <div id="bg-grain"/>

      {/* Top HUD */}
      <div className="top-hud" style={{ opacity: scrolled ? 0 : 1, transform: `translateY(${scrolled ? -16 : 0}px)` }}>
        <div className="glass glass-thin" style={{ padding: '10px 20px 10px 16px', display: 'flex', alignItems: 'center', borderRadius: 999 }}>
          <img src="../assets/logo-main.png" alt="ElPique" style={{ height: 44, width: 'auto', display: 'block', filter: 'drop-shadow(0 0 14px rgba(200,255,0,0.55))' }}/>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-glass btn-icon" aria-label="Buscar"><I.Search width="16" height="16"/></button>
          <button className="btn btn-glass btn-icon" style={{ background: 'rgba(200,255,0,0.18)', borderColor: 'rgba(200,255,0,0.35)', color: 'var(--rodeo-lime)' }} aria-label="Perfil" onClick={() => navigate('perfil')}><I.User width="16" height="16"/></button>
        </div>
      </div>

      {/* Screens */}
      <div id="stage">
        {screen === 'home' && <HomeScreen onNavigate={navigate} scrollRef={scrollRef}/>}
        {screen !== 'home' && (
          <div className="screen" ref={scrollRef}>
            <div className="soon">
              <div className="glass" style={{ padding: 40, maxWidth: 420, textAlign: 'center' }}>
                <I.Compass width="32" height="32" style={{ color: 'var(--rodeo-lime)', margin: '0 auto 8px', display: 'block' }}/>
                <h2>{NAV_ITEMS.find(n => n.key === screen)?.label}</h2>
                <p>Esta pantalla está en camino. Aprobá el Home primero y vamos construyendo una por una con el mismo Liquid Glass.</p>
                <button className="btn btn-lime" onClick={() => navigate('home')} style={{ marginTop: 16 }}>← Volver al Home</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav (morphing) */}
      <div className={`bottom-nav-wrap ${scrolled ? 'scrolled' : ''}`}>
        <div className={`bottom-nav ${scrolled ? 'collapsed' : ''}`}>
          <span className="tab-morph-hint">Morphing en scroll</span>
          {NAV_ITEMS.map(it => {
            const Icon = I[it.icon];
            const active = screen === it.key;
            return (
              <button key={it.key} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(it.key)} aria-label={it.label}>
                <Icon/>
                <span className="label">{it.label}</span>
              </button>
            );
          })}
        </div>
        <button className="nav-float-action" aria-label="Nueva reserva" onClick={() => navigate('explorar')}>
          <I.Plus width="22" height="22"/>
        </button>
      </div>

      {/* Tweaks trigger */}
      <button id="tweak-trigger" className="btn btn-glass btn-icon" onClick={() => setTweaksOpen(v => !v)} aria-label="Tweaks">
        <I.Sliders width="16" height="16"/>
      </button>

      {/* Tweaks panel */}
      <div className={`glass ${tweaksOpen ? 'open' : ''}`} id="tweaks">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Tweaks</h4>
          <button className="btn btn-glass btn-icon" style={{ width: 28, height: 28, padding: 4 }} onClick={() => setTweaksOpen(false)}><I.X width="14" height="14"/></button>
        </div>
        <div className="tweak-row">
          <div className="tweak-label">Blur <span className="val">{blur}px</span></div>
          <input type="range" min="10" max="80" value={blur} onChange={e => setBlur(+e.target.value)}/>
        </div>
        <div className="tweak-row">
          <div className="tweak-label">Saturation <span className="val">{sat}%</span></div>
          <input type="range" min="100" max="260" value={sat} onChange={e => setSat(+e.target.value)}/>
        </div>
        <div className="tweak-row">
          <div className="tweak-label">Card radius <span className="val">{radius}px</span></div>
          <input type="range" min="12" max="44" value={radius} onChange={e => setRadius(+e.target.value)}/>
        </div>
        <div className="tweak-row">
          <div className="tweak-label">Background video</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.keys(VIDEOS).map(k => (
              <button key={k} onClick={() => setVideoKey(k)} className={`tweak-toggle ${videoKey === k ? 'on' : ''}`} style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}>{k}</button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <button className={`tweak-toggle ${lightMode ? 'on' : ''}`} onClick={() => setLightMode(v => !v)} style={{ width: '100%' }}>
            <span>Light mode</span>
            <span>{lightMode ? '● ON' : '○ OFF'}</span>
          </button>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';
import { useOwnerTooltips, TooltipDef } from '@/lib/hooks/useOwnerTooltips';

interface Props {
  tooltip: TooltipDef;
  /** Where the bubble appears relative to the icon */
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}

export default function OwnerTooltip({ tooltip, position = 'bottom', children }: Props) {
  const { autoShow, dismiss, isDismissed, ready } = useOwnerTooltips();
  const [manualOpen, setManualOpen] = useState(false);

  if (!ready) return <>{children}</>;

  // autoShow only fires during the first N days AND if not dismissed this session
  const showAuto = autoShow && !isDismissed(tooltip.id);
  const isOpen = showAuto || manualOpen;

  const bubblePos: Record<string, React.CSSProperties> = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%',   left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left:   { right: '100%', top: '50%',  transform: 'translateY(-50%)', marginRight: 8 },
    right:  { left: '100%',  top: '50%',  transform: 'translateY(-50%)', marginLeft: 8 },
  };

  return (
    <span className="relative inline-flex items-center gap-1.5">
      {children}
      <span className="relative inline-flex">
        {/* Pulsing ring — only during auto-show period */}
        {showAuto && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: 'rgba(200,255,0,0.4)' }} />
        )}
        <button
          onClick={() => setManualOpen(v => !v)}
          className="relative flex items-center justify-center w-4 h-4 rounded-full transition-colors"
          style={{ background: showAuto ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.1)' }}
          title="Ayuda"
        >
          <HelpCircle size={12} className={showAuto ? 'text-rodeo-lime' : 'text-rodeo-cream/40'} />
        </button>
      </span>

      {/* Bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              zIndex: 100,
              width: 240,
              ...bubblePos[position],
              background: 'rgba(20,30,20,0.98)',
              border: '1px solid rgba(200,255,0,0.3)',
              borderRadius: 12,
              padding: '10px 12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-[11px] font-black text-rodeo-lime uppercase tracking-widest">Ayuda</p>
              <button onClick={() => { dismiss(tooltip.id); setManualOpen(false); }}
                className="text-rodeo-cream/30 hover:text-white transition-colors shrink-0">
                <X size={12} />
              </button>
            </div>
            <p className="text-xs text-rodeo-cream/80 leading-relaxed">{tooltip.text}</p>
            {tooltip.link && (
              <a href={tooltip.link} className="inline-flex items-center gap-1 text-[11px] font-bold text-rodeo-lime hover:underline mt-2">
                {tooltip.linkLabel || 'Ver más →'}
              </a>
            )}
            {showAuto && (
              <p className="text-[10px] text-rodeo-cream/30 mt-2 border-t border-white/8 pt-2">
                El ícono <strong className="text-rodeo-cream/50">?</strong> siempre queda disponible para consultar.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

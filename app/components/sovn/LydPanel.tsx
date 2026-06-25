'use client';
import React, { useState, useRef } from 'react';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import { OversettelseNøkkel } from '../../lib/i18n/translations';

type Props = { onLukk: () => void; };

type Lyd = { id: string; navn: string; fil: string; };
type Gruppe = { kategori: string; lyder: Lyd[]; };

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

const getLyder = (t: TFn): Gruppe[] => [
  {
    kategori: t('lyd.roligeLyder'),
    lyder: [
      { id: 'regn', navn: t('lyd.regn'), fil: '/lyder/regn.mp3' },
      { id: 'hav', navn: t('lyd.hav'), fil: '/lyder/hav.mp3' },
      { id: 'white-noise', navn: t('lyd.whiteNoise'), fil: '/lyder/white-noise.mp3' },
      { id: 'vifte', navn: t('lyd.vifte'), fil: '/lyder/vifte.mp3' },
      { id: 'hjertelyd', navn: t('lyd.hjertelyd'), fil: '/lyder/hjertelyd.mp3' },
    ],
  },
  {
    kategori: t('lyd.regulering'),
    lyder: [
      { id: 'pustelyder', navn: t('lyd.pustelyder'), fil: '/lyder/pustelyder.mp3' },
      { id: 'womb', navn: t('lyd.womb'), fil: '/lyder/womb.mp3' },
      { id: 'rytmer', navn: t('lyd.rytmer'), fil: '/lyder/rytmer.mp3' },
      { id: 'frekvenser', navn: t('lyd.frekvenser'), fil: '/lyder/frekvenser.mp3' },
    ],
  },
  {
    kategori: t('lyd.foreldrero'),
    lyder: [
      { id: 'nattpust', navn: t('lyd.nattpust'), fil: '/lyder/nattpust.mp3' },
      { id: 'piano', navn: t('lyd.piano'), fil: '/lyder/piano.mp3' },
      { id: 'grounding', navn: t('lyd.grounding'), fil: '/lyder/grounding.mp3' },
    ],
  },
];

const LydIkon = ({ id }: { id: string }) => {
  const ikoner: Record<string, React.ReactElement> = {
    regn: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 16C4 16 2 14.5 2 12C2 9.8 3.5 8 5.5 7.5C5.8 5.5 7.5 4 9.5 4C11 4 12.3 4.8 13 6C13.5 5.4 14.2 5 15 5C16.7 5 18 6.3 18 8C19.7 8.3 21 9.8 21 11.5C21 13.5 19.3 15 17.5 15" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <line x1="8" y1="18" x2="7" y2="21" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="18" x2="11" y2="21" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="18" x2="15" y2="21" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    hav: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M2 12 C5 9 8 15 11 12 C14 9 17 15 20 12 C21.5 10.5 22.5 11 22.5 11" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M2 16 C5 13 8 19 11 16 C14 13 17 19 20 16" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
    ),
    'white-noise': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="2" height="8" rx="1" fill="#8AAEE0" opacity="0.4"/>
        <rect x="7" y="5" width="2" height="14" rx="1" fill="#8AAEE0" opacity="0.7"/>
        <rect x="11" y="3" width="2" height="18" rx="1" fill="#8AAEE0"/>
        <rect x="15" y="5" width="2" height="14" rx="1" fill="#8AAEE0" opacity="0.7"/>
        <rect x="19" y="8" width="2" height="8" rx="1" fill="#8AAEE0" opacity="0.4"/>
      </svg>
    ),
    vifte: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2" fill="#8AAEE0"/>
        <path d="M12 10 C12 10 11 6 13 4 C15 2 16 4 15 6 C14 8 12 10 12 10Z" fill="#8AAEE0" opacity="0.6"/>
        <path d="M14 12 C14 12 18 11 20 13 C22 15 20 16 18 15 C16 14 14 12 14 12Z" fill="#8AAEE0" opacity="0.6"/>
        <path d="M12 14 C12 14 13 18 11 20 C9 22 8 20 9 18 C10 16 12 14 12 14Z" fill="#8AAEE0" opacity="0.6"/>
        <path d="M10 12 C10 12 6 13 4 11 C2 9 4 8 6 9 C8 10 10 12 10 12Z" fill="#8AAEE0" opacity="0.6"/>
      </svg>
    ),
    hjertelyd: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M2 12H5L7 8L9 16L11 10L13 14L15 12H22" stroke="#8AAEE0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    pustelyder: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 4 C12 4 8 8 8 12 C8 16 12 20 12 20 C12 20 16 16 16 12 C16 8 12 4 12 4Z" stroke="#C4A882" strokeWidth="1.5" fill="none"/>
        <ellipse cx="12" cy="12" rx="3" ry="4" stroke="#C4A882" strokeWidth="1.2" fill="none" opacity="0.5"/>
      </svg>
    ),
    womb: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#C4A882" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="4" stroke="#C4A882" strokeWidth="1.2" fill="none" opacity="0.6"/>
        <circle cx="12" cy="12" r="1.5" fill="#C4A882" opacity="0.8"/>
      </svg>
    ),
    rytmer: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 14 C6 14 6 10 8 10 C10 10 10 16 12 16 C14 16 14 8 16 8 C18 8 18 14 20 14" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    frekvenser: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M2 12 Q6 4 12 12 Q18 20 22 12" stroke="#C4A882" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M5 12 Q8 7 12 12 Q16 17 19 12" stroke="#C4A882" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
    ),
    nattpust: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.5C20.4 15.8 17.5 18 14 18C10 18 7 15 7 11C7 8 9 5.5 12 4.5C9.5 7 9.5 11 12.5 13.5C15.5 16 19.5 15 21 12.5Z" fill="none" stroke="#E8C87A" strokeWidth="1.5"/>
        <path d="M14 8 C14 8 15 6 17 7" stroke="#E8C87A" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    piano: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="2" stroke="#E8C87A" strokeWidth="1.5" fill="none"/>
        <line x1="6" y1="6" x2="6" y2="20" stroke="#E8C87A" strokeWidth="1" opacity="0.5"/>
        <line x1="10" y1="6" x2="10" y2="20" stroke="#E8C87A" strokeWidth="1" opacity="0.5"/>
        <line x1="14" y1="6" x2="14" y2="20" stroke="#E8C87A" strokeWidth="1" opacity="0.5"/>
        <line x1="18" y1="6" x2="18" y2="20" stroke="#E8C87A" strokeWidth="1" opacity="0.5"/>
        <rect x="4" y="6" width="3" height="8" rx="1" fill="#E8C87A" opacity="0.6"/>
        <rect x="8" y="6" width="3" height="8" rx="1" fill="#E8C87A" opacity="0.6"/>
        <rect x="16" y="6" width="3" height="8" rx="1" fill="#E8C87A" opacity="0.6"/>
      </svg>
    ),
    grounding: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3 C12 3 7 8 7 13 C7 16.3 9.2 19 12 19 C14.8 19 17 16.3 17 13 C17 8 12 3 12 3Z" stroke="#E8C87A" strokeWidth="1.5" fill="none"/>
        <path d="M9 13 C9 13 10 15 12 15 C14 15 15 13 15 13" stroke="#E8C87A" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
        <line x1="12" y1="19" x2="12" y2="22" stroke="#E8C87A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="21" x2="15" y2="21" stroke="#E8C87A" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };
  return ikoner[id] || (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#8A8FA8" strokeWidth="1.5" fill="none"/>
    </svg>
  );
};

export default function LydPanel({ onLukk }: Props) {
  const { t } = useLanguage();
  const LYDER = getLyder(t);

  const [aktivLyd, setAktivLyd] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const spillLyd = (lyd: Lyd) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (aktivLyd === lyd.id) {
      setAktivLyd(null);
      return;
    }
    const audio = new Audio(lyd.fil);
    audio.loop = true;
    audio.volume = 0.7;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setAktivLyd(lyd.id);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onLukk}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#0D1B3E',
          borderRadius: '24px 24px 0 0',
          padding: '20px 24px 40px',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'sheetUp 0.3s ease-out',
        }}>
        <style>{`@keyframes sheetUp { 0%{transform:translateY(100%)} 100%{transform:translateY(0)} }`}</style>

        <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 16px' }} />

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: '#E8DDD0', fontWeight: '600' }}>{t('lyd.skapRo')}</div>
            <button onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } onLukk(); }} style={{ background: 'none', border: 'none', color: '#8A8FA8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginTop: '6px' }}>
            {t('lyd.undertittel')}
          </div>
        </div>

        <div style={{ fontSize: '13px', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '20px' }}>
          {t('lyd.velgEnLyd')}
        </div>

        {LYDER.map((gruppe, gi) => (
          <div key={gi} style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-inter)', color: '#8A8FA8', marginBottom: '10px' }}>
              {gruppe.kategori}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gruppe.lyder.map(lyd => (
                <button key={lyd.id} onClick={() => spillLyd(lyd)} style={{
                  padding: '14px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  backgroundColor: aktivLyd === lyd.id ? 'rgba(124,143,212,0.2)' : 'rgba(255,255,255,0.05)',
                  borderWidth: '1px', borderStyle: 'solid',
                  borderColor: aktivLyd === lyd.id ? 'rgba(124,143,212,0.5)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}>
                  <LydIkon id={lyd.id} />
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-inter)', color: aktivLyd === lyd.id ? '#E8DDD0' : '#C4A882', flex: 1 }}>
                    {lyd.navn}
                  </div>
                  <div>
                    {aktivLyd === lyd.id ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" fill="rgba(124,143,212,0.3)"/>
                        <rect x="8" y="8" width="3" height="8" rx="1" fill="#8AAEE0"/>
                        <rect x="13" y="8" width="3" height="8" rx="1" fill="#8AAEE0"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                        <path d="M10 8L16 12L10 16V8Z" fill="rgba(255,255,255,0.4)"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { farger } from '../../lib/farger';

type Barn = {
  id: number;
  navn: string;
  fødselsdato: string;
  favoritter: string;
};

type Props = {
  bruker: any;
  aktivtBarnId: number | null;
  onByttBarn: (barn: Barn) => void;
};

export default function BarnVelger({ bruker, aktivtBarnId, onByttBarn }: Props) {
  const [alleBarn, setAlleBarn] = useState<Barn[]>([]);
  const [visMeny, setVisMeny] = useState(false);
  const [aktivtBarn, setAktivtBarn] = useState<Barn | null>(null);
  const [babyBilde, setBabyBilde] = useState<string | null>(null);

  useEffect(() => {
    const lastBarn = async () => {
      const { data } = await supabase
        .from('barn')
        .select('*')
        .eq('bruker_id', bruker.id)
        .order('opprettet', { ascending: true });
      if (data && data.length > 0) {
        setAlleBarn(data);
        const aktivt = data.find((b: Barn) => b.id === aktivtBarnId) || data[0];
        setAktivtBarn(aktivt);
        const lagretBilde = localStorage.getItem(`lille_babybilde_${aktivt.id}`);
        if (lagretBilde) setBabyBilde(lagretBilde);
      }
    };
    lastBarn();
  }, [bruker.id, aktivtBarnId]);

  const byttBarn = (barn: Barn) => {
    setAktivtBarn(barn);
    const lagretBilde = localStorage.getItem(`lille_babybilde_${barn.id}`);
    setBabyBilde(lagretBilde);
    onByttBarn(barn);
    setVisMeny(false);
  };

  const forbokstav = aktivtBarn?.navn?.charAt(0).toUpperCase() || '?';

  return (
    <>
      {/* Knapp øverst til venstre */}
      <button
        onClick={() => setVisMeny(true)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: farger.grønnLys,
          border: `2px solid ${farger.grønn}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {babyBilde ? (
          <img src={babyBilde} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '16px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
            {forbokstav}
          </span>
        )}
      </button>

      {/* Meny */}
      {visMeny && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setVisMeny(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: farger.hvit, width: '100%', maxWidth: '430px', borderRadius: '24px 24px 0 0', padding: '24px', paddingBottom: '48px' }}
          >
            <div style={{ width: '36px', height: '4px', backgroundColor: farger.kremMørk, borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600', marginBottom: '16px' }}>
              Velg barn
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {alleBarn.map(barn => {
                const bilde = localStorage.getItem(`lille_babybilde_${barn.id}`);
                const erAktivt = barn.id === aktivtBarn?.id;
                const alderIMnd = () => {
                  if (!barn.fødselsdato) return '';
                  const nå = new Date();
                  const født = new Date(barn.fødselsdato);
                  const mnd = (nå.getFullYear() - født.getFullYear()) * 12 + (nå.getMonth() - født.getMonth());
                  if (mnd < 12) return `${mnd} måneder`;
                  return `${Math.floor(mnd / 12)} år`;
                };
                return (
                  <button
                    key={barn.id}
                    onClick={() => byttBarn(barn)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      backgroundColor: erAktivt ? farger.grønnLys : farger.bakgrunn,
                      border: `1.5px solid ${erAktivt ? farger.grønn : farger.kremMørk}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: farger.kremMørk, border: `2px solid ${erAktivt ? farger.grønn : 'transparent'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {bilde ? (
                        <img src={bilde} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '20px', fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn, fontWeight: '700' }}>
                          {barn.navn.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontFamily: 'var(--font-plus-jakarta)', color: farger.tekst, fontWeight: '600' }}>
                        {barn.navn}
                      </div>
                      {barn.fødselsdato && (
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-inter)', color: farger.tekstLys }}>
                          {alderIMnd()}
                        </div>
                      )}
                    </div>
                    {erAktivt && (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: farger.grønn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setVisMeny(false); }}
              style={{ width: '100%', padding: '14px', backgroundColor: farger.bakgrunn, border: `1px dashed ${farger.kremMørk}`, borderRadius: '14px', fontSize: '14px', fontFamily: 'var(--font-inter)', color: farger.tekstLys, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke={farger.tekstLys} strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Legg til nytt barn
            </button>
          </div>
        </div>
      )}
    </>
  );
}
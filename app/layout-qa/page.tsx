'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { isLocale, type Locale } from '../lib/i18n/locales';
import { farger } from '../lib/farger';

const NAVN = 'Wilhelm';

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: farger.hvit,
        border: `1px solid ${farger.kremMørk}`,
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: farger.tekstLys,
          fontFamily: 'var(--font-inter)',
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function LayoutQaInner() {
  const params = useSearchParams();
  const { locale, setLocale, t } = useLanguage();
  const lang = params.get('lang');

  useEffect(() => {
    if (isLocale(lang)) setLocale(lang as Locale);
  }, [lang, setLocale]);

  const langs: Locale[] = ['de', 'fi', 'ja'];

  return (
    <div style={{ backgroundColor: '#F7F3EC', minHeight: '100vh', padding: '20px 16px 80px' }}>
      <div style={{ maxWidth: 390, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {langs.map((l) => (
            <a
              key={l}
              href={`/layout-qa?lang=${l}`}
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                textDecoration: 'none',
                fontFamily: 'var(--font-inter)',
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: locale === l ? farger.grønn : farger.hvit,
                color: locale === l ? '#FDFAF6' : farger.tekst,
                border: `1px solid ${locale === l ? farger.grønn : farger.kremMørk}`,
              }}
            >
              {l.toUpperCase()}
            </a>
          ))}
        </div>

        <div style={{ fontSize: 22, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, color: farger.tekst, marginBottom: 6 }}>
          Layout QA · {locale}
        </div>
        <div style={{ fontSize: 13, color: farger.tekstLys, marginBottom: 24, fontFamily: 'var(--font-inter)' }}>
          Longest copy from home / sleep / insights
        </div>

        <Section title="Hjem">
          <div
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(235,200,180,0.4)',
              borderRadius: 20,
              padding: '10px 14px',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 20 }}>✨</div>
              <div style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-inter)', color: '#3F3A37', lineHeight: 1.6 }}>
                <span style={{ fontSize: 15 }}>💛</span> <strong>{t('hjem.aiTomTittel')}</strong>
                <br />
                {t('hjem.aiTomTekst')}
                <div style={{ fontSize: 12, color: '#A8B5A2', marginTop: 6, fontWeight: 500 }}>{t('hjem.seAlleInnsikter')} ›</div>
              </div>
            </div>
          </div>

          <Card>
            <div style={{ fontSize: 13, color: '#A8B5A2', marginBottom: 8 }}>{t('hjem.analyserer', { navn: NAVN })}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: farger.tekst }}>{t('hjem.begynnRegistrereInnsikt', { navn: NAVN })}</div>
          </Card>

          {[
            t('hjem.aiInnsiktRolig'),
            t('hjem.aiInnsiktTrøtt'),
            t('hjem.aiInnsiktUrolig'),
            t('hjem.aiInnsiktSover'),
          ].map((txt, i) => (
            <Card key={i} style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: farger.tekst }}>{txt}</div>
            </Card>
          ))}

          <Card>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, marginBottom: 8 }}>
              {t('hjem.glemtLeggetidTittel')}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: farger.tekstLys, marginBottom: 16 }}>{t('hjem.glemtLeggetidTekst')}</div>
            <button
              type="button"
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 16,
                border: `1px solid ${farger.grønn}`,
                background: farger.grønnLys,
                color: farger.grønn,
                fontWeight: 600,
                fontFamily: 'var(--font-inter)',
                marginBottom: 8,
              }}
            >
              {t('hjem.registrerLeggetid')}
            </button>
            <button
              type="button"
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 16,
                border: `1px solid ${farger.kremMørk}`,
                background: 'transparent',
                color: farger.tekstLys,
                fontFamily: 'var(--font-inter)',
              }}
            >
              {t('hjem.startNyDag')}
            </button>
          </Card>

          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, marginBottom: 8 }}>
                {t('hjem.delLilleMedVenn')}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: farger.tekstLys }}>{t('hjem.delBeskrivelse')}</div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: t('hjem.amming'), sub: t('hjem.oppsummeringAmming', { antall: 3 }) },
              { label: t('hjem.uroRo'), sub: t('hjem.signaler') },
              { label: t('nav.innsikt'), sub: t('hjem.seInnsikt') },
              { label: t('nav.søvn'), sub: t('hjem.nesteLur') },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: farger.hvit,
                  border: `1px solid ${farger.kremMørk}`,
                  borderRadius: 16,
                  padding: 14,
                  minHeight: 72,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: farger.tekst, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: farger.tekstLys }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Søvn">
          <div style={{ fontSize: 22, fontFamily: 'var(--font-plus-jakarta)', marginBottom: 4, lineHeight: 1.3 }}>
            {t('søvn.hvaSlagsSøvn')}
          </div>
          <div style={{ fontSize: 13, color: farger.tekstLys, marginBottom: 16 }}>{t('søvn.velgType')}</div>

          <button
            type="button"
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: farger.grønnLys,
              border: `1px solid ${farger.grønn}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              textAlign: 'left',
              marginBottom: 12,
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${farger.grønn}`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-plus-jakarta)', color: farger.grønn }}>{t('søvn.etterregistrer')}</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-inter)', color: farger.grønn }}>{t('søvn.etterregistrerBeskrivelse')}</div>
            </div>
          </button>

          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: farger.tekstLys, marginBottom: 6 }}>{t('søvn.tips')}</div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: farger.tekstLys }}>{t('søvn.tipsBeskrivelse')}</div>
          </Card>

          <Card>
            <div style={{ fontSize: 15, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 600, marginBottom: 12 }}>
              {t('søvn.nattensSammendrag')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t('søvn.kvalitetUrolig')}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: farger.tekstLys, marginBottom: 10 }}>{t('søvn.kvalitetUroligTekst')}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: farger.tekstLys, marginBottom: 10 }}>{t('søvn.kvalitetUtmerketTekst')}</div>
            <div style={{ fontSize: 13, color: farger.tekstLys }}>
              {t('søvn.nattensInnsikt')} · {t('søvn.nattensTidslinje')}
            </div>
          </Card>
        </Section>

        <Section title="Innsikt">
          <div
            style={{
              background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF0D6 100%)',
              border: '1px solid #F4D9A0',
              borderRadius: 24,
              padding: '28px 24px',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 20, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
              {t('innsikt.velkommen')}
            </div>
            <div style={{ fontSize: 13, color: '#6B5040', lineHeight: 1.7, marginBottom: 16 }}>
              {t('innsikt.velkommenBeskrivelse', { navn: NAVN })}
              <br />
              <br />
              {t('innsikt.joMerViRegistrerer')}
            </div>
            <button
              type="button"
              style={{
                padding: '13px 24px',
                background: 'linear-gradient(135deg, #F4A853, #E8943F)',
                border: 'none',
                borderRadius: 50,
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'var(--font-inter)',
              }}
            >
              + {t('innsikt.registrerFørsteSignal')}
            </button>
          </div>

          <Card>
            <div style={{ textAlign: 'center', fontSize: 15, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, marginBottom: 16 }}>
              ✨ {t('innsikt.detteVilDuFåInnsiktI')} ✨
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { tittel: t('innsikt.vanligsteSignaler'), tekst: t('innsikt.vanligsteSignalerTekst') },
                { tittel: t('innsikt.signalrekkefølge'), tekst: t('innsikt.signalrekkefølgeTekst') },
                { tittel: t('innsikt.overganger'), tekst: t('innsikt.overgangerTekst') },
                { tittel: t('innsikt.personligeMønstre'), tekst: t('innsikt.personligeMønstreTekst') },
              ].map((item) => (
                <div key={item.tittel} style={{ backgroundColor: '#FFF8EC', borderRadius: 16, padding: 14, minHeight: 110 }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
                    {item.tittel}
                  </div>
                  <div style={{ fontSize: 11, color: farger.tekstLys, lineHeight: 1.45 }}>{item.tekst}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 11, fontWeight: 600, color: farger.tekstLys, marginBottom: 8 }}>{t('innsikt.aiObservasjon')}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>{t('innsikt.aiLærerFortsatt', { navn: NAVN })}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>{t('innsikt.mønsterFørProsent', { pst: 61 })}</div>
            <div style={{ fontSize: 12, color: farger.tekstLys, marginBottom: 6 }}>{t('innsikt.aiAnalysererKommunikasjon', { navn: NAVN })}</div>
            <div style={{ fontSize: 12, color: farger.tekstLys }}>{t('innsikt.aiAnalysererMønstre', { navn: NAVN })}</div>
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: farger.tekstLys, marginBottom: 6 }}>{t('innsikt.typiskVeiModSøvn')}</div>
            </div>
            <div style={{ flex: 1, background: farger.hvit, border: `1px solid ${farger.kremMørk}`, borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#BE123C', marginBottom: 6 }}>{t('innsikt.typiskVeiTilUro')}</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default function LayoutQaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>…</div>}>
      <LayoutQaInner />
    </Suspense>
  );
}

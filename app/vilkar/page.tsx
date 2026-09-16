'use client';

import { useLanguage } from '../lib/i18n/LanguageContext';
import { farger } from '../lib/farger';

export default function Vilkar() {
  const { t } = useLanguage();

  return (
    <>
      <button
        onClick={() => window.history.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '16px 24px',
          fontSize: '15px',
          fontFamily: 'var(--font-inter)',
          color: farger.grønn,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke={farger.grønn} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('felles.tilbake')}
      </button>
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          fontFamily: 'var(--font-inter), sans-serif',
          lineHeight: 1.7,
          color: '#3F3A37',
        }}
      >
        <h1 style={{ fontSize: '28px', marginBottom: '8px', fontFamily: 'var(--font-plus-jakarta)' }}>
          Terms of Use for Lille
        </h1>
        <p style={{ color: '#7B746D', marginBottom: '32px' }}>Version 2026-01 · Last updated: January 2026</p>

        <p>
          These Terms of Use (&quot;Terms&quot;) govern your use of the Lille application and related services
          (the &quot;Service&quot;), provided by Isabella Figved / Lille (&quot;we&quot;, &quot;us&quot;). By creating an account
          or using the Service, you agree to these Terms.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>1. The Service</h2>
        <p>
          Lille helps caregivers track and understand infant routines such as sleep, feeding, diapers,
          signals and related activities. The Service may include insights generated with the help of AI.
          Lille is a consumer self-help tool and does not provide medical advice, diagnosis or treatment.
          Always seek professional care for health concerns.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>2. Account</h2>
        <p>
          You must provide accurate information and keep your login credentials secure. You are responsible
          for activity under your account. You must be old enough to enter a binding agreement in your country
          of residence. If you invite a partner, you confirm you have the right to share access to the child&apos;s
          data with that person.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>3. Subscription and payment</h2>
        <p>
          Parts of Lille are offered as a paid subscription. Depending on how you subscribe, payment may be
          processed by Apple (App Store), Google Play, or Stripe on the web. Prices, trial periods, renewal
          and cancellation follow the rules of the payment provider you use. Subscriptions renew automatically
          until cancelled according to those rules. Taxes may apply.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>4. Health and child data</h2>
        <p>
          When you log information about a baby (for example sleep, feeding or symptoms), you may provide
          health-related and other sensitive personal data. You confirm that you are a parent or legal guardian,
          or that you otherwise have a lawful basis to register and process this information in Lille.
          How we process personal data is described in our Privacy Policy.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>5. Acceptable use</h2>
        <p>
          You may not misuse the Service, attempt unauthorized access, reverse engineer the app except where
          permitted by law, or use Lille in a way that harms other users or our systems. We may suspend or
          terminate accounts that violate these Terms.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>6. Intellectual property</h2>
        <p>
          Lille, including its branding, design and software, is owned by us or our licensors. You retain
          ownership of the content you enter. You grant us a limited licence to host and process that content
          solely to operate and improve the Service.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>7. Availability and changes</h2>
        <p>
          We aim for reliable availability but do not guarantee uninterrupted Service. We may update features
          and these Terms. Material changes will be communicated in a reasonable way. Continued use after
          changes take effect constitutes acceptance, where allowed by law. The version identifier (for example
          2026-01) helps document which Terms you accepted.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>8. Account deletion</h2>
        <p>
          You may delete your account and associated data from within the app (Settings). Deletion is permanent.
          Subscription cancellations must also be handled with Apple, Google or Stripe as applicable.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Lille is provided &quot;as is&quot;. We are not liable for indirect
          or consequential losses, or for decisions you make based on insights in the app. Nothing in these
          Terms limits liability that cannot be limited under applicable law (including mandatory consumer rights).
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>10. Governing law</h2>
        <p>
          These Terms are governed by the laws of Norway, without prejudice to mandatory consumer protections
          in your country of residence in the EEA/UK or elsewhere.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>11. Contact</h2>
        <p>
          Isabella Figved
          <br />
          Email: isabellafjellet@gmail.com
          <br />
          Website: https://lilleapp.no
        </p>

        <p style={{ marginTop: '32px', color: '#7B746D', fontSize: '14px' }}>
          Related: <a href="/personvern" style={{ color: farger.grønn }}>Privacy Policy</a>
        </p>
      </div>
    </>
  );
}

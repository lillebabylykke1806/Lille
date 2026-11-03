import { CANCELLATION_REASON_BUTTONS } from '../../lib/email/templates';
import { lesEpostToken, lesEpostTokenSignatur } from '../../lib/email/hmac';
import { epostSpråkForBruker } from '../../lib/email/locale';
import { EpostKnapp, EpostSkall } from '../EpostSkall';

export const dynamic = 'force-dynamic';

const REASONS = new Set(CANCELLATION_REASON_BUTTONS.en.map((r) => r.id));

export default async function TilbakemeldingPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; ok?: string }>;
}) {
  const { t, ok } = await searchParams;
  const forSpråk = lesEpostTokenSignatur(t, 'feedback');
  const token = lesEpostToken(t, 'feedback');
  const språk = await epostSpråkForBruker(forSpråk?.u);
  const reason = token?.r && REASONS.has(token.r) ? token.r : 'other';

  const labels = CANCELLATION_REASON_BUTTONS[språk];
  const valgt = labels.find((r) => r.id === reason)?.label ?? reason;

  const copy =
    språk === 'no'
      ? {
          title: 'Hvorfor sluttet du?',
          ok: 'Tusen takk. Jeg leser hver tilbakemelding.',
          ugyldig: 'Denne lenken er ugyldig eller utløpt.',
          kommentar: 'Vil du legge til noe? (valgfritt)',
          knapp: 'Send',
        }
      : {
          title: 'Why did you leave?',
          ok: 'Thank you. I read every piece of feedback.',
          ugyldig: 'This link is invalid or has expired.',
          kommentar: 'Anything to add? (optional)',
          knapp: 'Send',
        };

  if (ok === '1') {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.ok}</p>
      </EpostSkall>
    );
  }
  if (!token || !t) {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.ugyldig}</p>
      </EpostSkall>
    );
  }

  return (
    <EpostSkall title={copy.title} lang={språk}>
      <p style={{ margin: '0 0 16px' }}>{valgt}</p>
      <form method="post" action="/api/e-post/tilbakemelding">
        <input type="hidden" name="t" value={t} />
        <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>{copy.kommentar}</label>
        <textarea
          name="comment"
          rows={4}
          style={{
            width: '100%',
            marginBottom: 16,
            borderRadius: 12,
            border: '1px solid #E0D5C5',
            padding: 12,
            fontSize: 16,
            fontFamily: 'inherit',
          }}
        />
        <EpostKnapp label={copy.knapp} />
      </form>
    </EpostSkall>
  );
}

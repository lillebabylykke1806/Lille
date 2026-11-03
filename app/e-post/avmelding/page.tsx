import { lesEpostToken, lesEpostTokenSignatur } from '../../lib/email/hmac';
import { epostSpråkForBruker } from '../../lib/email/locale';
import { EpostKnapp, EpostSkall } from '../EpostSkall';

export const dynamic = 'force-dynamic';

export default async function AvmeldingPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; ok?: string }>;
}) {
  const { t, ok } = await searchParams;
  const forSpråk = lesEpostTokenSignatur(t, 'unsub');
  const token = lesEpostToken(t, 'unsub');
  const språk = await epostSpråkForBruker(forSpråk?.u);

  const copy =
    språk === 'no'
      ? {
          title: 'Avmelding',
          ok: 'Du er meldt av e-post fra Lille. Du kan slå det på igjen i innstillingene.',
          ugyldig: 'Denne lenken er ugyldig eller utløpt.',
          tekst: 'Trykk på knappen for å stoppe e-post fra Lille. Ingenting skjer før du bekrefter.',
          knapp: 'Meld meg av',
        }
      : {
          title: 'Unsubscribe',
          ok: "You've been unsubscribed from Lille emails. You can turn this back on in settings.",
          ugyldig: 'This link is invalid or has expired.',
          tekst: 'Tap the button to stop emails from Lille. Nothing happens until you confirm.',
          knapp: 'Unsubscribe',
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
      <p style={{ margin: '0 0 20px' }}>{copy.tekst}</p>
      <form method="post" action="/api/e-post/avmelding">
        <input type="hidden" name="t" value={t} />
        <EpostKnapp label={copy.knapp} />
      </form>
    </EpostSkall>
  );
}

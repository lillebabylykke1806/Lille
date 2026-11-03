import { lesEpostToken, lesEpostTokenSignatur } from '../../lib/email/hmac';
import { epostSpråkForBruker } from '../../lib/email/locale';
import { EpostKnapp, EpostSkall } from '../EpostSkall';

export const dynamic = 'force-dynamic';

export default async function KomTilbakePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; status?: string }>;
}) {
  const { t, status } = await searchParams;
  const forSpråk = lesEpostTokenSignatur(t, 'winback');
  const token = lesEpostToken(t, 'winback');
  const språk = await epostSpråkForBruker(forSpråk?.u);

  const copy =
    språk === 'no'
      ? {
          title: 'Velkommen tilbake',
          tekst: 'Trykk for å fortsette til sikker betaling med 30 % rabatt på første måned. Ingen prøveperiode. Ingenting skjer før du bekrefter.',
          knapp: 'Kom tilbake – 30 % på første måned',
          ugyldig: 'Denne lenken kan ikke brukes lenger.',
          brukt: 'Denne rabatten er allerede brukt. Du kan fortsatt abonnere på vanlig vis i appen.',
          aktiv: 'Du har allerede et aktivt Lille-abonnement.',
        }
      : {
          title: 'Welcome back',
          tekst: 'Tap to continue to secure checkout with 30% off your first month. No trial. Nothing happens until you confirm.',
          knapp: 'Come back – 30% off your first month',
          ugyldig: 'This link can no longer be used.',
          brukt: 'This discount has already been used. You can still subscribe in the app.',
          aktiv: 'You already have an active Lille subscription.',
        };

  if (status === 'used') {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.brukt}</p>
      </EpostSkall>
    );
  }
  if (status === 'active') {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.aktiv}</p>
      </EpostSkall>
    );
  }
  if (status === 'invalid' || !token || !t) {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.ugyldig}</p>
      </EpostSkall>
    );
  }

  return (
    <EpostSkall title={copy.title} lang={språk}>
      <p style={{ margin: '0 0 20px' }}>{copy.tekst}</p>
      <form method="post" action="/api/e-post/kom-tilbake">
        <input type="hidden" name="t" value={t} />
        <EpostKnapp label={copy.knapp} />
      </form>
    </EpostSkall>
  );
}

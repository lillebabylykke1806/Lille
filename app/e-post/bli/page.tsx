import { lesEpostToken, lesEpostTokenSignatur } from '../../lib/email/hmac';
import { epostSpråkForBruker } from '../../lib/email/locale';
import { EpostKnapp, EpostSkall } from '../EpostSkall';

export const dynamic = 'force-dynamic';

export default async function BliPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; status?: string }>;
}) {
  const { t, status } = await searchParams;
  const forSpråk = lesEpostTokenSignatur(t, 'stay');
  const token = lesEpostToken(t, 'stay');
  const språk = await epostSpråkForBruker(forSpråk?.u);

  const copy =
    språk === 'no'
      ? {
          title: 'Bli likevel',
          tekst: 'Trykk for å beholde Lille og få 30 % rabatt på neste måned. Ingenting skjer før du bekrefter.',
          knapp: 'Jeg blir likevel – 30 % på neste måned',
          ok: 'Så fint at du blir! 30 % rabatt er lagt på neste måned.',
          brukt: 'Rabatten er allerede brukt på dette abonnementet. Du har fortsatt tilgang ut perioden.',
          ugyldig: 'Denne lenken kan ikke brukes lenger. Hvis abonnementet er utløpt eller allerede er aktivt, er det helt i orden.',
        }
      : {
          title: "I'll stay",
          tekst: 'Tap to keep Lille and get 30% off next month. Nothing happens until you confirm.',
          knapp: "I'll stay – 30% off next month",
          ok: "So glad you're staying! 30% off has been added to your next month.",
          brukt: 'This discount has already been used on the subscription. You still have access until the period ends.',
          ugyldig: 'This link can no longer be used. If the subscription has ended or is already active, that’s okay.',
        };

  if (status === 'ok') {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.ok}</p>
      </EpostSkall>
    );
  }
  if (status === 'used') {
    return (
      <EpostSkall title={copy.title} lang={språk}>
        <p style={{ margin: 0 }}>{copy.brukt}</p>
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
      <form method="post" action="/api/e-post/bli">
        <input type="hidden" name="t" value={t} />
        <EpostKnapp label={copy.knapp} />
      </form>
    </EpostSkall>
  );
}

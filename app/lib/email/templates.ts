import type { EpostSpråk } from './locale';

export const EPOST_AVSENDER_NO = 'Isabella fra Lille <post@lilleapp.no>';
export const EPOST_AVSENDER_EN = 'Isabella at Lille <post@lilleapp.no>';
export const EPOST_REPLY_TO = 'post@lilleapp.no';

/** Kept for iOS cancellation mail later. Not used in Stripe cancellation mail. */
export const CANCELLATION_REASON_BUTTONS = {
  no: [
    { id: 'unused', label: 'Jeg brukte den ikke nok' },
    { id: 'too_expensive', label: 'Det ble for dyrt' },
    { id: 'missing_features', label: 'Jeg savnet noen funksjoner' },
    { id: 'technical', label: 'Jeg hadde tekniske problemer' },
    { id: 'other', label: 'Noe annet' },
  ],
  en: [
    { id: 'unused', label: "I wasn't using it enough" },
    { id: 'too_expensive', label: 'It was too expensive' },
    { id: 'missing_features', label: 'I was missing some features' },
    { id: 'technical', label: 'I had technical problems' },
    { id: 'other', label: 'Something else' },
  ],
} as const;

export type Reason = (typeof CANCELLATION_REASON_BUTTONS.en)[number]['id'];

export function isReason(value: string): value is Reason {
  return CANCELLATION_REASON_BUTTONS.en.some((r) => r.id === value);
}

function htmlMal(opts: {
  lang: EpostSpråk;
  hilsen: string;
  avsnitt: string[];
  signatur: string;
  knapper?: { href: string; label: string }[];
  footerText: string;
  footerHref: string;
}): string {
  const avsnittHtml = opts.avsnitt
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#3D2B1F;font-family:Georgia,serif;">${p}</p>`,
    )
    .join('');
  const knapperHtml = (opts.knapper ?? [])
    .map(
      (k) =>
        `<a href="${k.href}" style="display:inline-block;background:#2D5C45;color:#FDFAF6;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:600;font-family:system-ui,sans-serif;font-size:15px;margin:0 8px 12px 0;">${k.label}</a>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<body style="margin:0;padding:0;background:#F5EFE6;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#FDFAF6;border:1px solid #E0D5C5;border-radius:20px;padding:28px 24px;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2D5C45;font-family:system-ui,sans-serif;font-weight:700;">Lille</p>
      <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#3D2B1F;font-family:Georgia,serif;">${opts.hilsen}</h1>
      ${avsnittHtml}
      <p style="margin:8px 0 24px;font-size:16px;line-height:1.65;color:#3D2B1F;font-family:Georgia,serif;">${opts.signatur}</p>
      ${knapperHtml}
    </div>
    <p style="margin:20px 8px 0;font-size:12px;line-height:1.5;color:#8A7060;font-family:system-ui,sans-serif;">
      <a href="${opts.footerHref}" style="color:#8A7060;">${opts.footerText}</a>
    </p>
  </div>
</body>
</html>`;
}

export function avsender(språk: EpostSpråk): string {
  return språk === 'no' ? EPOST_AVSENDER_NO : EPOST_AVSENDER_EN;
}

export function kanselleringMal(
  språk: EpostSpråk,
  opts: { stayHref?: string | null; unsubHref: string },
): { from: string; subject: string; text: string; html: string } {
  const stay = opts.stayHref;
  if (språk === 'no') {
    const avsnitt = [
      'Jeg så at du har sagt opp Lille-abonnementet ditt, og jeg vil bare si tusen takk for at du ga Lille en sjanse.',
      'Lille er fortsatt ganske ny, og tilbakemeldingen din betyr veldig mye for meg.',
      'Du kan også bare svare på denne e-posten.',
      stay
        ? 'Du har Premium ut perioden du har betalt for. Ombestemmer du deg før den tid, vil jeg gjerne gi deg 30 % rabatt på neste måned.'
        : 'Du har Premium ut perioden du har betalt for.',
    ];
    const textLines = [
      'Hei,',
      '',
      ...avsnitt,
      stay ? `Jeg blir likevel – 30 % på neste måned: ${stay}` : '',
      '',
      'Klem,',
      'Isabella',
      'Gründer av Lille',
    ].filter((l) => l !== '');
    return {
      from: avsender('no'),
      subject: 'Takk for at du prøvde Lille 🤍',
      text: textLines.join('\n'),
      html: htmlMal({
        lang: 'no',
        hilsen: 'Hei,',
        avsnitt,
        signatur: 'Klem,<br/>Isabella<br/>Gründer av Lille',
        knapper: stay ? [{ href: stay, label: 'Jeg blir likevel – 30 % på neste måned' }] : [],
        footerText: 'Meld deg av e-post fra Lille',
        footerHref: opts.unsubHref,
      }),
    };
  }

  const avsnitt = [
    "I noticed you've cancelled your Lille subscription, and I just want to say thank you so much for giving Lille a try.",
    'Lille is still quite new, and your feedback means so much to me.',
    'You can also simply reply to this email.',
    stay
      ? "You'll keep Premium until the end of the period you've paid for. If you change your mind before then, I'd love to give you 30% off your next month."
      : "You'll keep Premium until the end of the period you've paid for.",
  ];
  return {
    from: avsender('en'),
    subject: 'Thank you for trying Lille 🤍',
    text: [
      'Hi there,',
      '',
      ...avsnitt,
      stay ? `I'll stay – 30% off next month: ${stay}` : '',
      '',
      'Love,',
      'Isabella',
      'Founder of Lille',
    ]
      .filter((l) => l !== '')
      .join('\n'),
    html: htmlMal({
      lang: 'en',
      hilsen: 'Hi there,',
      avsnitt,
      signatur: 'Love,<br/>Isabella<br/>Founder of Lille',
      knapper: stay ? [{ href: stay, label: "I'll stay – 30% off next month" }] : [],
      footerText: 'Unsubscribe from Lille emails',
      footerHref: opts.unsubHref,
    }),
  };
}

export function winbackMal(
  språk: EpostSpråk,
  opts: { comebackHref: string; unsubHref: string },
): { from: string; subject: string; text: string; html: string } {
  if (språk === 'no') {
    const avsnitt = [
      'Det har gått en uke siden Premium-tilgangen din i Lille gikk ut, og jeg ville bare si at du alltid er velkommen tilbake.',
      'Hvis du vil prøve igjen, får du 30 % rabatt på første måned.',
    ];
    return {
      from: avsender('no'),
      subject: 'Døra står alltid åpen 🤍',
      text: `Hei,\n\n${avsnitt.join('\n\n')}\n\nKom tilbake – 30 % på første måned: ${opts.comebackHref}\n\nKlem,\nIsabella\nGründer av Lille`,
      html: htmlMal({
        lang: 'no',
        hilsen: 'Hei,',
        avsnitt,
        signatur: 'Klem,<br/>Isabella<br/>Gründer av Lille',
        knapper: [{ href: opts.comebackHref, label: 'Kom tilbake – 30 % på første måned' }],
        footerText: 'Meld deg av e-post fra Lille',
        footerHref: opts.unsubHref,
      }),
    };
  }
  const avsnitt = [
    "It's been a week since your Lille Premium access ended, and I just wanted to say you're always welcome back.",
    "If you'd like to give it another try, you'll get 30% off your first month.",
  ];
  return {
    from: avsender('en'),
    subject: 'The door is always open 🤍',
    text: `Hi there,\n\n${avsnitt.join('\n\n')}\n\nCome back – 30% off your first month: ${opts.comebackHref}\n\nLove,\nIsabella\nFounder of Lille`,
    html: htmlMal({
      lang: 'en',
      hilsen: 'Hi there,',
      avsnitt,
      signatur: 'Love,<br/>Isabella<br/>Founder of Lille',
      knapper: [{ href: opts.comebackHref, label: 'Come back – 30% off your first month' }],
      footerText: 'Unsubscribe from Lille emails',
      footerHref: opts.unsubHref,
    }),
  };
}

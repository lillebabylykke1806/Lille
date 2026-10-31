import type { OversettelseNøkkel } from './i18n/translations';

export type FlaskeInnsiktType = 'trygghet' | 'signaler' | 'observasjon' | 'tips';

export type FlaskeInnsiktRad = {
  dato: string;
  klokkeslett: string;
  mengde_ml: number;
};

export type FlaskeInnsiktValg = {
  type: FlaskeInnsiktType;
  typeNøkkel: OversettelseNøkkel;
  tekstNøkkel: OversettelseNøkkel;
};

type Kategori = {
  id: string;
  type: FlaskeInnsiktType;
  typeNøkkel: OversettelseNøkkel;
  varianter: OversettelseNøkkel[];
};

const TYPE_REKKEFØLGE: FlaskeInnsiktType[] = ['trygghet', 'signaler', 'observasjon', 'tips'];

const TYPE_NØKKEL: Record<FlaskeInnsiktType, OversettelseNøkkel> = {
  trygghet: 'flaske.innsiktTypeTrygghet',
  signaler: 'flaske.innsiktTypeSignaler',
  observasjon: 'flaske.innsiktTypeObservasjon',
  tips: 'flaske.innsiktTypeTips',
};

const K: Record<string, Kategori> = {
  trygghet: {
    id: 'trygghet',
    type: 'trygghet',
    typeNøkkel: TYPE_NØKKEL.trygghet,
    varianter: [
      'flaske.innsiktTrygghet1',
      'flaske.innsiktTrygghet2',
      'flaske.innsiktTrygghet3',
      'flaske.innsiktTrygghet4',
      'flaske.innsiktTrygghet5',
    ],
  },
  trygghetStart: {
    id: 'trygghetStart',
    type: 'trygghet',
    typeNøkkel: TYPE_NØKKEL.trygghet,
    varianter: [
      'flaske.innsiktStart1',
      'flaske.innsiktStart2',
      'flaske.innsiktStart3',
      'flaske.innsiktStart4',
    ],
  },
  signaler: {
    id: 'signaler',
    type: 'signaler',
    typeNøkkel: TYPE_NØKKEL.signaler,
    varianter: [
      'flaske.innsiktSignaler1',
      'flaske.innsiktSignaler2',
      'flaske.innsiktSignaler3',
      'flaske.innsiktSignaler4',
      'flaske.innsiktSignaler5',
    ],
  },
  signalerHyppig: {
    id: 'signalerHyppig',
    type: 'signaler',
    typeNøkkel: TYPE_NØKKEL.signaler,
    varianter: [
      'flaske.innsiktSult1',
      'flaske.innsiktSult2',
      'flaske.innsiktSult3',
    ],
  },
  obsMorgen: {
    id: 'obsMorgen',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: ['flaske.innsiktObsMorgen1', 'flaske.innsiktObsMorgen2', 'flaske.innsiktObsMorgen3'],
  },
  obsMindre: {
    id: 'obsMindre',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: [
      'flaske.innsiktObsMindre1',
      'flaske.innsiktObsMindre2',
      'flaske.innsiktObsMindre3',
      'flaske.innsiktObsMindre4',
    ],
  },
  obsMer: {
    id: 'obsMer',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: [
      'flaske.innsiktObsMer1',
      'flaske.innsiktObsMer2',
      'flaske.innsiktObsMer3',
      'flaske.innsiktObsMer4',
    ],
  },
  obsKveld: {
    id: 'obsKveld',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: ['flaske.innsiktObsKveld1', 'flaske.innsiktObsKveld2', 'flaske.innsiktObsKveld3'],
  },
  obsHyppig: {
    id: 'obsHyppig',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: ['flaske.innsiktObsHyppig1', 'flaske.innsiktObsHyppig2', 'flaske.innsiktObsHyppig3'],
  },
  obsLengre: {
    id: 'obsLengre',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: ['flaske.innsiktObsLengre1', 'flaske.innsiktObsLengre2', 'flaske.innsiktObsLengre3'],
  },
  obsStabil: {
    id: 'obsStabil',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: ['flaske.innsiktObsStabil1', 'flaske.innsiktObsStabil2', 'flaske.innsiktObsStabil3'],
  },
  tips: {
    id: 'tips',
    type: 'tips',
    typeNøkkel: TYPE_NØKKEL.tips,
    varianter: [
      'flaske.innsiktTips1',
      'flaske.innsiktTips2',
      'flaske.innsiktTips3',
      'flaske.innsiktTips4',
      'flaske.innsiktTips5',
    ],
  },
};

function isoIDag() {
  return new Date().toISOString().split('T')[0];
}

function timeHour(klokkeslett: string) {
  const h = parseInt((klokkeslett || '0').replace('.', ':').slice(0, 2), 10);
  if (!Number.isFinite(h)) return 0;
  return ((h % 24) + 24) % 24;
}

function minuttPåDøgnet(klokkeslett: string) {
  const [h, m] = (klokkeslett || '00:00').replace('.', ':').slice(0, 5).split(':').map(Number);
  return ((h || 0) * 60 + (m || 0) + 24 * 60) % (24 * 60);
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function typiskPerDag(logg: FlaskeInnsiktRad[], unntattDato: string) {
  const perDag = new Map<string, { ml: number; antall: number }>();
  for (const f of logg) {
    if (f.dato === unntattDato) continue;
    const forrige = perDag.get(f.dato) || { ml: 0, antall: 0 };
    forrige.ml += f.mengde_ml;
    forrige.antall += 1;
    perDag.set(f.dato, forrige);
  }
  const dager = [...perDag.values()];
  if (dager.length < 2) return null;
  return {
    ml: dager.reduce((s, d) => s + d.ml, 0) / dager.length,
    antall: dager.reduce((s, d) => s + d.antall, 0) / dager.length,
  };
}

function snittPauseMin(rader: FlaskeInnsiktRad[]) {
  if (rader.length < 2) return null;
  const sortert = [...rader].sort((a, b) =>
    a.dato === b.dato
      ? minuttPåDøgnet(a.klokkeslett) - minuttPåDøgnet(b.klokkeslett)
      : a.dato.localeCompare(b.dato),
  );
  const pauser: number[] = [];
  for (let i = 1; i < sortert.length; i++) {
    if (sortert[i].dato !== sortert[i - 1].dato) continue;
    let diff = minuttPåDøgnet(sortert[i].klokkeslett) - minuttPåDøgnet(sortert[i - 1].klokkeslett);
    if (diff <= 0) continue;
    pauser.push(diff);
  }
  if (pauser.length === 0) return null;
  return pauser.reduce((s, n) => s + n, 0) / pauser.length;
}

function velgBlant(kategorier: Kategori[], dato: string): FlaskeInnsiktValg {
  const typer = TYPE_REKKEFØLGE.filter(type => kategorier.some(k => k.type === type));
  const ønsketType = typer[hashStr(dato) % Math.max(typer.length, 1)] || kategorier[0].type;
  const avType = kategorier.filter(k => k.type === ønsketType);
  const pool = avType.length > 0 ? avType : kategorier;
  const kategori = pool[hashStr(`${dato}:${ønsketType}`) % pool.length];
  const variant = kategori.varianter[hashStr(`${dato}:${kategori.id}`) % kategori.varianter.length];
  return {
    type: kategori.type,
    typeNøkkel: kategori.typeNøkkel,
    tekstNøkkel: variant,
  };
}

/**
 * Rule-based bottle insight. No LLM.
 * Health-centre thresholds (large drop over days, fewer wet diapers, lethargy)
 * are not wired until Isabella approves the numbers.
 */
export function velgFlaskeInnsikt(logg: FlaskeInnsiktRad[], dato = isoIDag()): FlaskeInnsiktValg {
  const iDag = logg.filter(f => f.dato === dato);
  const unikeDager = new Set(logg.map(f => f.dato)).size;
  const liteData = logg.length < 5 || unikeDager < 2;
  const nokData = logg.length >= 5 && unikeDager >= 2;
  const typisk = typiskPerDag(logg, dato);
  const iDagMl = iDag.reduce((s, f) => s + f.mengde_ml, 0);
  const mer = Boolean(typisk && iDag.length > 0 && iDagMl >= typisk.ml * 1.18);
  const mindre = Boolean(typisk && iDag.length > 0 && iDagMl <= typisk.ml * 0.82);
  const hyppig = Boolean(typisk && iDag.length >= Math.ceil(typisk.antall + 1.5));
  const kveldAntall = iDag.filter(f => timeHour(f.klokkeslett) >= 20).length;
  const kveld = iDag.length >= 2 && kveldAntall >= 2 && kveldAntall / iDag.length >= 0.45;

  const ukeRader = logg;
  const morgenMl = ukeRader.filter(f => {
    const h = timeHour(f.klokkeslett);
    return h >= 5 && h < 11;
  }).reduce((s, f) => s + f.mengde_ml, 0);
  const restenMl = ukeRader.reduce((s, f) => s + f.mengde_ml, 0) - morgenMl;
  const morgen = unikeDager >= 3 && ukeRader.length >= 6 && morgenMl > 0 && morgenMl >= restenMl * 0.55;

  const pauseIDag = snittPauseMin(iDag);
  const pauseEllers = snittPauseMin(logg.filter(f => f.dato !== dato));
  const lengre = Boolean(
    pauseIDag && pauseEllers && iDag.length >= 2 && pauseIDag >= pauseEllers * 1.25,
  );

  const mlPerDag: number[] = [];
  const perDag = new Map<string, number>();
  for (const f of logg) perDag.set(f.dato, (perDag.get(f.dato) || 0) + f.mengde_ml);
  for (const ml of perDag.values()) mlPerDag.push(ml);
  const snittMl = mlPerDag.reduce((s, n) => s + n, 0) / Math.max(mlPerDag.length, 1);
  const stabil = nokData && unikeDager >= 4 && mlPerDag.every(ml => Math.abs(ml - snittMl) / snittMl <= 0.2);

  const pool: Kategori[] = [];

  if (liteData) {
    pool.push(K.tips, K.trygghetStart);
    return velgBlant(pool, dato);
  }

  if (mindre) pool.push(K.obsMindre);
  if (mer) pool.push(K.obsMer);
  if (hyppig) pool.push(K.signalerHyppig, K.obsHyppig);
  if (lengre) pool.push(K.obsLengre);
  if (kveld) pool.push(K.obsKveld);
  if (morgen) pool.push(K.obsMorgen);
  if (stabil && !mindre && !mer) pool.push(K.obsStabil);

  if (!mindre) pool.push(K.trygghet);
  pool.push(K.signaler, K.tips);

  return velgBlant(pool, dato);
}

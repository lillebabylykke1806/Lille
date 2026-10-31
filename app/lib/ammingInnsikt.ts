import type { OversettelseNøkkel } from './i18n/translations';

export type AmmingInnsiktType = 'trygghet' | 'signaler' | 'observasjon' | 'tips';

export type AmmingInnsiktRad = {
  dato: string;
  start: string;
  varighet: number;
  bryst: string;
};

export type AmmingInnsiktValg = {
  type: AmmingInnsiktType;
  typeNøkkel: OversettelseNøkkel;
  tekstNøkkel: OversettelseNøkkel;
};

type Kategori = {
  id: string;
  type: AmmingInnsiktType;
  typeNøkkel: OversettelseNøkkel;
  varianter: OversettelseNøkkel[];
};

const TYPE_REKKEFØLGE: AmmingInnsiktType[] = ['trygghet', 'signaler', 'observasjon', 'tips'];

const TYPE_NØKKEL: Record<AmmingInnsiktType, OversettelseNøkkel> = {
  trygghet: 'amming.innsiktTypeTrygghet',
  signaler: 'amming.innsiktTypeSignaler',
  observasjon: 'amming.innsiktTypeObservasjon',
  tips: 'amming.innsiktTypeTips',
};

const v = (keys: OversettelseNøkkel[]): OversettelseNøkkel[] => keys;

const K: Record<string, Kategori> = {
  trygghet: {
    id: 'trygghet',
    type: 'trygghet',
    typeNøkkel: TYPE_NØKKEL.trygghet,
    varianter: v([
      'amming.innsiktTrygghet1',
      'amming.innsiktTrygghet2',
      'amming.innsiktTrygghet3',
      'amming.innsiktTrygghet4',
      'amming.innsiktTrygghet5',
    ]),
  },
  trygghetStart: {
    id: 'trygghetStart',
    type: 'trygghet',
    typeNøkkel: TYPE_NØKKEL.trygghet,
    varianter: v([
      'amming.innsiktStart1',
      'amming.innsiktStart2',
      'amming.innsiktStart3',
      'amming.innsiktStart4',
    ]),
  },
  signaler: {
    id: 'signaler',
    type: 'signaler',
    typeNøkkel: TYPE_NØKKEL.signaler,
    varianter: v([
      'amming.innsiktSignaler1',
      'amming.innsiktSignaler2',
      'amming.innsiktSignaler3',
      'amming.innsiktSignaler4',
      'amming.innsiktSignaler5',
    ]),
  },
  signalerKlynge: {
    id: 'signalerKlynge',
    type: 'signaler',
    typeNøkkel: TYPE_NØKKEL.signaler,
    varianter: v(['amming.innsiktKlynge1', 'amming.innsiktKlynge2', 'amming.innsiktKlynge3']),
  },
  obsNatt: {
    id: 'obsNatt',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: v(['amming.innsiktObsNatt1', 'amming.innsiktObsNatt2', 'amming.innsiktObsNatt3']),
  },
  obsKlynge: {
    id: 'obsKlynge',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: v(['amming.innsiktObsKlynge1', 'amming.innsiktObsKlynge2', 'amming.innsiktObsKlynge3']),
  },
  obsLengre: {
    id: 'obsLengre',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: v(['amming.innsiktObsLengre1', 'amming.innsiktObsLengre2', 'amming.innsiktObsLengre3']),
  },
  obsKort: {
    id: 'obsKort',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: v(['amming.innsiktObsKort1', 'amming.innsiktObsKort2', 'amming.innsiktObsKort3']),
  },
  obsBryst: {
    id: 'obsBryst',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: v(['amming.innsiktObsBryst1', 'amming.innsiktObsBryst2', 'amming.innsiktObsBryst3']),
  },
  obsStabil: {
    id: 'obsStabil',
    type: 'observasjon',
    typeNøkkel: TYPE_NØKKEL.observasjon,
    varianter: v(['amming.innsiktObsStabil1', 'amming.innsiktObsStabil2', 'amming.innsiktObsStabil3']),
  },
  tips: {
    id: 'tips',
    type: 'tips',
    typeNøkkel: TYPE_NØKKEL.tips,
    varianter: v([
      'amming.innsiktTips1',
      'amming.innsiktTips2',
      'amming.innsiktTips3',
      'amming.innsiktTips4',
      'amming.innsiktTips5',
    ]),
  },
};

function isoIDag() {
  return new Date().toISOString().split('T')[0];
}

function timeHour(start: string) {
  const h = parseInt((start || '0').replace('.', ':').slice(0, 2), 10);
  if (!Number.isFinite(h)) return 0;
  return ((h % 24) + 24) % 24;
}

function minuttPåDøgnet(start: string) {
  const [h, m] = (start || '00:00').replace('.', ':').slice(0, 5).split(':').map(Number);
  return ((h || 0) * 60 + (m || 0) + 24 * 60) % (24 * 60);
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function typiskPerDag(logg: AmmingInnsiktRad[], unntattDato: string) {
  const perDag = new Map<string, { antall: number; varighet: number }>();
  for (const f of logg) {
    if (f.dato === unntattDato) continue;
    const forrige = perDag.get(f.dato) || { antall: 0, varighet: 0 };
    forrige.antall += 1;
    forrige.varighet += f.varighet || 0;
    perDag.set(f.dato, forrige);
  }
  const dager = [...perDag.values()];
  if (dager.length < 2) return null;
  return {
    antall: dager.reduce((s, d) => s + d.antall, 0) / dager.length,
    varighet: dager.reduce((s, d) => s + d.varighet, 0) / dager.length,
  };
}

function snittPauseMin(rader: AmmingInnsiktRad[]) {
  if (rader.length < 2) return null;
  const sortert = [...rader].sort((a, b) =>
    a.dato === b.dato
      ? minuttPåDøgnet(a.start) - minuttPåDøgnet(b.start)
      : a.dato.localeCompare(b.dato),
  );
  const pauser: number[] = [];
  for (let i = 1; i < sortert.length; i++) {
    if (sortert[i].dato !== sortert[i - 1].dato) continue;
    const diff = minuttPåDøgnet(sortert[i].start) - minuttPåDøgnet(sortert[i - 1].start);
    if (diff <= 0) continue;
    pauser.push(diff);
  }
  if (pauser.length === 0) return null;
  return pauser.reduce((s, n) => s + n, 0) / pauser.length;
}

function velgBlant(kategorier: Kategori[], dato: string): AmmingInnsiktValg {
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
 * Rule-based breastfeeding insight. No LLM.
 * Does not infer milk supply from duration.
 */
export function velgAmmingInnsikt(logg: AmmingInnsiktRad[], dato = isoIDag()): AmmingInnsiktValg {
  const iDag = logg.filter(f => f.dato === dato);
  const unikeDager = new Set(logg.map(f => f.dato)).size;
  const liteData = logg.length < 5 || unikeDager < 2;
  const nokData = logg.length >= 5 && unikeDager >= 2;
  const typisk = typiskPerDag(logg, dato);

  const hyppig = Boolean(typisk && iDag.length >= Math.ceil(typisk.antall + 1.5));
  const nattAntall = iDag.filter(f => {
    const h = timeHour(f.start);
    return h >= 21 || h < 5;
  }).length;
  const natt = iDag.length >= 2 && nattAntall >= 2 && nattAntall / iDag.length >= 0.4;

  const pauseIDag = snittPauseMin(iDag);
  const pauseEllers = snittPauseMin(logg.filter(f => f.dato !== dato));
  const lengre = Boolean(
    pauseIDag && pauseEllers && iDag.length >= 2 && pauseIDag >= pauseEllers * 1.25,
  );

  const snittVarighetIDag = iDag.length
    ? iDag.reduce((s, f) => s + (f.varighet || 0), 0) / iDag.length
    : 0;
  const snittVarighetEllers = logg.filter(f => f.dato !== dato).length
    ? logg.filter(f => f.dato !== dato).reduce((s, f) => s + (f.varighet || 0), 0) /
      logg.filter(f => f.dato !== dato).length
    : 0;
  const kort = Boolean(
    nokData && iDag.length >= 2 && snittVarighetEllers > 0 && snittVarighetIDag <= snittVarighetEllers * 0.7,
  );

  const venstre = logg.filter(f => f.bryst === 'venstre').length;
  const høyre = logg.filter(f => f.bryst === 'høyre').length;
  const brystTotal = venstre + høyre;
  const skjevt = nokData && brystTotal >= 6 && (venstre / brystTotal >= 0.7 || høyre / brystTotal >= 0.7);

  const antallPerDag: number[] = [];
  const perDag = new Map<string, number>();
  for (const f of logg) perDag.set(f.dato, (perDag.get(f.dato) || 0) + 1);
  for (const n of perDag.values()) antallPerDag.push(n);
  const snittAntall = antallPerDag.reduce((s, n) => s + n, 0) / Math.max(antallPerDag.length, 1);
  const stabil = nokData && unikeDager >= 4 && antallPerDag.every(n => Math.abs(n - snittAntall) / snittAntall <= 0.25);

  if (liteData) {
    return velgBlant([K.tips, K.trygghetStart], dato);
  }

  const pool: Kategori[] = [];
  if (hyppig) pool.push(K.signalerKlynge, K.obsKlynge);
  if (natt) pool.push(K.obsNatt);
  if (lengre) pool.push(K.obsLengre);
  if (kort) pool.push(K.obsKort);
  if (skjevt) pool.push(K.obsBryst);
  if (stabil && !hyppig) pool.push(K.obsStabil);
  pool.push(K.trygghet, K.signaler, K.tips);
  return velgBlant(pool, dato);
}

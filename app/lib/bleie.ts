import type { OversettelseNøkkel } from './i18n/translations';

export type BleieFlags = {
  vat: boolean;
  avforing: boolean;
};

export type BleieRowLike = {
  vat?: boolean | null;
  avforing?: boolean | null;
  type?: string | null;
};

/** Map UI / DB flags to legacy type string for old clients. */
export function bleieTypeFromFlags({ vat, avforing }: BleieFlags): 'tørr' | 'våt' | 'avføring' | 'våt_avføring' {
  if (vat && avforing) return 'våt_avføring';
  if (vat) return 'våt';
  if (avforing) return 'avføring';
  return 'tørr';
}

/**
 * Prefer boolean columns; fall back to legacy type.
 * If booleans are both false but type is a wet/soiled value, trust type
 * (covers partial writes before schema cache refresh).
 */
export function bleieFlagsFromRow(row: BleieRowLike): BleieFlags {
  const fromType = (type: string): BleieFlags => {
    if (type === 'våt_avføring') return { vat: true, avforing: true };
    if (type === 'våt') return { vat: true, avforing: false };
    if (type === 'avføring') return { vat: false, avforing: true };
    return { vat: false, avforing: false };
  };

  if (typeof row.vat === 'boolean' || typeof row.avforing === 'boolean') {
    const flags = {
      vat: Boolean(row.vat),
      avforing: Boolean(row.avforing),
    };
    if (!flags.vat && !flags.avforing && row.type && row.type !== 'tørr') {
      return fromType(row.type);
    }
    return flags;
  }
  return fromType(row.type || '');
}

type TFn = (nøkkel: OversettelseNøkkel, variabler?: Record<string, string | number>) => string;

export function bleieTypeLabel(t: TFn, flags: BleieFlags): string {
  if (flags.vat && flags.avforing) return t('bleie.typeVåtAvføring');
  if (flags.vat) return t('bleie.typeVåt');
  if (flags.avforing) return t('bleie.typeAvføring');
  return t('bleie.typeTørr');
}

/** Icon id used by BleieIkon: prefer wet when combined. */
export function bleieIkonType(flags: BleieFlags): string {
  if (flags.vat && flags.avforing) return 'våt_avføring';
  if (flags.vat) return 'våt';
  if (flags.avforing) return 'avføring';
  return 'tørr';
}

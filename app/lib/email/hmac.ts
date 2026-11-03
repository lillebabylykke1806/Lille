import { createHmac, timingSafeEqual } from 'crypto';
import type { EpostSpråk } from './locale';

export type EpostHandling = 'unsub' | 'stay' | 'winback' | 'feedback';

export type EpostToken = {
  v: 1;
  a: EpostHandling;
  u: string;
  exp: number;
  s?: string;
  r?: string;
};

function secret(): string {
  const value = process.env.EMAIL_LINK_SECRET?.trim();
  if (!value) throw new Error('EMAIL_LINK_SECRET missing');
  return value;
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64url');
}

export function signerEpostToken(token: EpostToken): string {
  const payload = b64url(JSON.stringify(token));
  const sig = createHmac('sha256', secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

function parseSignertToken(raw: string | null | undefined, handling: EpostHandling): EpostToken | null {
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  let forventet: Buffer;
  try {
    forventet = createHmac('sha256', secret()).update(payload).digest();
  } catch {
    return null;
  }
  const gitt = Buffer.from(sig, 'base64url');
  if (gitt.length !== forventet.length || !timingSafeEqual(gitt, forventet)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as EpostToken;
    if (data.v !== 1 || data.a !== handling || typeof data.u !== 'string') return null;
    if (typeof data.exp !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

/** Signature-valid token, including expired — used to load profiler.locale. */
export function lesEpostTokenSignatur(raw: string | null | undefined, handling: EpostHandling): EpostToken | null {
  return parseSignertToken(raw, handling);
}

export function lesEpostToken(raw: string | null | undefined, handling: EpostHandling): EpostToken | null {
  const data = parseSignertToken(raw, handling);
  if (!data) return null;
  if (Date.now() / 1000 > data.exp) return null;
  return data;
}

export function epostRedirect(
  req: Request,
  path: string,
  tokenRaw: string,
  extra: Record<string, string> = {},
): Response {
  const url = new URL(path, req.url);
  if (tokenRaw) url.searchParams.set('t', tokenRaw);
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  return Response.redirect(url, 303);
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://www.lilleapp.no').replace(/\/$/, '');
}

export function epostLenke(sti: string, token: string): string {
  const url = new URL(sti, `${appBaseUrl()}/`);
  url.searchParams.set('t', token);
  return url.toString();
}

export function signerUnsub(userId: string): string {
  return signerEpostToken({
    v: 1,
    a: 'unsub',
    u: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 400,
  });
}

export function signerStay(userId: string, subscriptionId: string, expUnix: number): string {
  return signerEpostToken({
    v: 1,
    a: 'stay',
    u: userId,
    s: subscriptionId,
    exp: expUnix,
  });
}

export function signerWinback(userId: string, språk: EpostSpråk): string {
  return signerEpostToken({
    v: 1,
    a: 'winback',
    u: userId,
    r: språk,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 21,
  });
}

export function signerFeedback(userId: string, reason: string): string {
  return signerEpostToken({
    v: 1,
    a: 'feedback',
    u: userId,
    r: reason,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60,
  });
}

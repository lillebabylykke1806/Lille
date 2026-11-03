/**
 * Cancellation / winback helpers (no Stripe live calls).
 * Run: npx tsx --test app/lib/email/email.test.ts
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { epostRedirect, lesEpostToken, lesEpostTokenSignatur, signerEpostToken, signerFeedback } from './hmac';
import { kanSendeTestEpost, parseTestEmailAllowlist } from './send';
import { velgEpostSpråk } from './locale';
import { CANCELLATION_REASON_BUTTONS, isReason, kanselleringMal, winbackMal } from './templates';
import { klassifiserStripeHendelse } from '../stripe/lifecycle';
import { invoiceSubscriptionId } from '../stripe/period';
import { rabattMatcherTilbake30 } from '../stripe/tilbake30';

describe('TEST_EMAIL_ALLOWLIST', () => {
  it('sends to anyone in live, and only listed addresses in test', () => {
    assert.equal(kanSendeTestEpost('a@x.com', true, ''), true);
    assert.equal(kanSendeTestEpost('post@lilleapp.no', false, 'post@lilleapp.no'), true);
    assert.equal(kanSendeTestEpost('other@x.com', false, 'post@lilleapp.no'), false);
    assert.equal(kanSendeTestEpost('post@lilleapp.no', false, ''), false);
    assert.deepEqual([...parseTestEmailAllowlist(' post@lilleapp.no , Isabella@lilleapp.no ')], [
      'post@lilleapp.no',
      'isabella@lilleapp.no',
    ]);
  });
});

describe('velgEpostSpråk', () => {
  it('uses Norwegian only for no, otherwise English', () => {
    assert.equal(velgEpostSpråk('no'), 'no');
    assert.equal(velgEpostSpråk('en'), 'en');
    assert.equal(velgEpostSpråk('sv'), 'en');
    assert.equal(velgEpostSpråk(null), 'en');
  });
});

describe('HMAC e-postlenker', () => {
  const prev = process.env.EMAIL_LINK_SECRET;
  before(() => {
    process.env.EMAIL_LINK_SECRET = 'test-email-link-secret';
  });
  after(() => {
    process.env.EMAIL_LINK_SECRET = prev;
  });

  it('roundtrips and rejects the wrong action', () => {
    const raw = signerEpostToken({
      v: 1,
      a: 'stay',
      u: 'user-1',
      s: 'sub_1',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    assert.equal(lesEpostToken(raw, 'stay')?.u, 'user-1');
    assert.equal(lesEpostToken(raw, 'unsub'), null);
  });

  it('keeps the token on POST redirects', () => {
    const raw = signerEpostToken({
      v: 1,
      a: 'stay',
      u: 'user-1',
      s: 'sub_1',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const res = epostRedirect(new Request('http://127.0.0.1:3000/api/e-post/bli'), '/e-post/bli', raw, {
      status: 'ok',
    });
    const loc = res.headers.get('location') || '';
    assert.equal(loc.includes('status=ok'), true);
    assert.equal(loc.includes(`t=${encodeURIComponent(raw)}`) || loc.includes(`t=${raw}`), true);
  });

  it('rejects expired tokens', () => {
    const raw = signerEpostToken({
      v: 1,
      a: 'unsub',
      u: 'user-1',
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    assert.equal(lesEpostToken(raw, 'unsub'), null);
    assert.equal(lesEpostTokenSignatur(raw, 'unsub')?.u, 'user-1');
  });

  it('keeps iOS feedback reasons in the token helper', () => {
    const raw = signerFeedback('user-1', 'too_expensive');
    assert.equal(lesEpostToken(raw, 'feedback')?.r, 'too_expensive');
  });
});

describe('isReason', () => {
  it('narrows known cancellation reasons', () => {
    assert.equal(isReason('too_expensive'), true);
    assert.equal(isReason('not_a_reason'), false);
  });
});

describe('klassifiserStripeHendelse', () => {
  it('maps cancel_at_period_end transitions', () => {
    assert.equal(
      klassifiserStripeHendelse({
        type: 'customer.subscription.updated',
        previousCancelAtPeriodEnd: false,
        cancelAtPeriodEnd: true,
      }),
      'CANCELLATION',
    );
    assert.equal(
      klassifiserStripeHendelse({
        type: 'customer.subscription.updated',
        previousCancelAtPeriodEnd: true,
        cancelAtPeriodEnd: false,
      }),
      'UNCANCELLATION',
    );
    assert.equal(
      klassifiserStripeHendelse({
        type: 'customer.subscription.updated',
        previousCancelAtPeriodEnd: true,
        cancelAtPeriodEnd: true,
      }),
      null,
    );
  });

  it('maps deleted, failed payment and invoices', () => {
    assert.equal(klassifiserStripeHendelse({ type: 'customer.subscription.deleted' }), 'EXPIRATION');
    assert.equal(klassifiserStripeHendelse({ type: 'invoice.payment_failed' }), 'BILLING_ISSUE');
    assert.equal(
      klassifiserStripeHendelse({ type: 'invoice.paid', billingReason: 'subscription_create' }),
      'INITIAL_PURCHASE',
    );
    assert.equal(
      klassifiserStripeHendelse({ type: 'invoice.paid', billingReason: 'subscription_cycle' }),
      'RENEWAL',
    );
  });
});

describe('kanselleringsmal for Stripe', () => {
  it('has thanks + offer and no reason buttons', () => {
    const mal = kanselleringMal('no', {
      stayHref: 'https://www.lilleapp.no/e-post/bli?t=x',
      unsubHref: 'https://www.lilleapp.no/e-post/avmelding?t=y',
    });
    assert.match(mal.subject, /Takk for at du prøvde Lille/);
    assert.match(mal.html, /Jeg blir likevel/);
    for (const knapp of CANCELLATION_REASON_BUTTONS.no) {
      assert.equal(mal.html.includes(knapp.label), false);
    }
  });

  it('omits stay CTA when the coupon was already used', () => {
    const mal = kanselleringMal('en', {
      stayHref: null,
      unsubHref: 'https://www.lilleapp.no/e-post/avmelding?t=y',
    });
    assert.equal(mal.html.includes("I'll stay"), false);
    assert.match(mal.html, /Unsubscribe from Lille emails/);
  });
});

describe('winback mal', () => {
  it('does not mention a trial', () => {
    const mal = winbackMal('no', {
      comebackHref: 'https://www.lilleapp.no/e-post/kom-tilbake?t=z',
      unsubHref: 'https://www.lilleapp.no/e-post/avmelding?t=y',
    });
    assert.equal(/prøveperiode|trial/i.test(mal.html + mal.text), false);
    assert.match(mal.html, /30 %/);
  });
});

describe('invoiceSubscriptionId (2026-03-25.dahlia)', () => {
  it('reads parent.subscription_details.subscription', () => {
    assert.equal(
      invoiceSubscriptionId({
        parent: { subscription_details: { subscription: 'sub_from_parent' } },
      } as any),
      'sub_from_parent',
    );
  });

  it('falls back to line item subscription_item_details', () => {
    assert.equal(
      invoiceSubscriptionId({
        parent: null,
        lines: {
          data: [
            {
              parent: {
                subscription_item_details: { subscription: 'sub_from_line' },
              },
            },
          ],
        },
      } as any),
      'sub_from_line',
    );
  });
});

describe('rabattMatcherTilbake30', () => {
  const ids = { promoId: 'promo_test', couponId: 'coupon_test', couponName: 'tilbake30' };

  it('matches promotion code, coupon id or coupon name', () => {
    assert.equal(
      rabattMatcherTilbake30(
        {
          promotion_code: 'promo_test',
          source: { coupon: 'other', type: 'coupon' },
        } as any,
        ids,
      ),
      true,
    );
    assert.equal(
      rabattMatcherTilbake30(
        {
          promotion_code: null,
          source: { coupon: { id: 'coupon_test', name: 'x' }, type: 'coupon' },
        } as any,
        ids,
      ),
      true,
    );
    assert.equal(
      rabattMatcherTilbake30(
        {
          promotion_code: null,
          source: { coupon: { id: 'other', name: 'TILBAKE30' }, type: 'coupon' },
        } as any,
        ids,
      ),
      true,
    );
    assert.equal(
      rabattMatcherTilbake30(
        {
          promotion_code: 'promo_other',
          source: { coupon: { id: 'other', name: 'other' }, type: 'coupon' },
        } as any,
        ids,
      ),
      false,
    );
  });
});

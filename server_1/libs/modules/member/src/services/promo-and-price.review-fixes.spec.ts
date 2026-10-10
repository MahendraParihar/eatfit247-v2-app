import { DiscountTypeEnum, IProductPrice } from '@eatfit247-shared-lib';
import { PromoCodeService, TxnPromoCode } from '@server_1/modules/promo-code';
import { MemberProductService } from './member-product.service';

/** Group 8 review fixes: DECIMAL-as-string promo math, and public product pricing. */
describe('PromoCodeService.applyPromoCode with DECIMAL strings', () => {
  const serviceWith = (row: Record<string, unknown>): PromoCodeService =>
    new PromoCodeService({ findOne: jest.fn().mockResolvedValue({ active: true, usedCount: 0, usageLimit: null, expiresAt: null, minOrderAmount: null, ...row }) } as unknown as typeof TxnPromoCode);

  it('does not raise a FLAT discount to max_discount when compared as text ("500.00" > "1000.00")', async () => {
    const service = serviceWith({ discountType: DiscountTypeEnum.FLAT, discountValue: '500.00', maxDiscount: '1000.00' });

    const result = await service.applyPromoCode({ code: 'SAVE500', orderAmount: 8000 });

    expect(result.discountAmount).toBe(500);
    expect(result.finalAmount).toBe(7500);
  });

  it('caps a PERCENT discount at max_discount numerically', async () => {
    const service = serviceWith({ discountType: DiscountTypeEnum.PERCENT, discountValue: '20.00', maxDiscount: '900.00' });

    const result = await service.applyPromoCode({ code: 'P20', orderAmount: 8000 });

    expect(result.discountAmount).toBe(900);
  });

  it('applies the minimum order amount numerically', async () => {
    const service = serviceWith({ discountType: DiscountTypeEnum.FLAT, discountValue: '100.00', minOrderAmount: '900.00' });

    await expect(service.applyPromoCode({ code: 'MIN', orderAmount: 1000 })).resolves.toMatchObject({ valid: true });
    await expect(service.applyPromoCode({ code: 'MIN', orderAmount: 800 })).resolves.toMatchObject({ valid: false });
  });
});

describe('MemberProductService public pricing', () => {
  const service = Object.create(MemberProductService.prototype) as MemberProductService;
  const pick = (prices: IProductPrice[], currency: string): IProductPrice | undefined =>
    service['findSellablePrice'](prices, currency);
  const day = 24 * 60 * 60 * 1000;

  it('skips inactive and expired prices and picks the one valid today', () => {
    const prices: IProductPrice[] = [
      { currency: 'INR', price: 900, active: false },
      { currency: 'INR', price: 1000, active: true, validTo: new Date(Date.now() - day) },
      { currency: 'INR', price: 1300, active: true, validFrom: new Date(Date.now() + day) },
      { currency: 'INR', price: 1200, active: true, validFrom: new Date(Date.now() - day) },
    ];

    expect(pick(prices, 'inr')?.price).toBe(1200);
  });

  it('a removed variant (only inactive prices) has no sellable price', () => {
    expect(pick([{ currency: 'INR', price: 1200, active: false }], 'INR')).toBeUndefined();
  });
});

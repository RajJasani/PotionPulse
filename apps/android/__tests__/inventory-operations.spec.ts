import { StockMovementType } from '@potionpulse/contracts';

describe('Android Inventory Operations & Safeguards', () => {
  it('correctly calculates projected balance and blocks negative stock operations', () => {
    const currentOnHand = 10;

    const calculateBalance = (onHand: number, delta: number) => {
      const nextBalance = onHand + delta;
      if (nextBalance < 0) {
        throw new Error('NEGATIVE_STOCK_BLOCKED');
      }
      return nextBalance;
    };

    // Valid decrease
    expect(calculateBalance(currentOnHand, -4)).toBe(6);

    // Valid increase (receipt)
    expect(calculateBalance(currentOnHand, 15)).toBe(25);

    // Negative stock blocked by invariant
    expect(() => calculateBalance(currentOnHand, -12)).toThrow(
      'NEGATIVE_STOCK_BLOCKED',
    );
  });

  it('generates appropriate movement types for stock adjustments', () => {
    const getMovementType = (delta: number): StockMovementType => {
      return delta >= 0
        ? StockMovementType.ADJUSTMENT_IN
        : StockMovementType.ADJUSTMENT_OUT;
    };

    expect(getMovementType(10)).toBe(StockMovementType.ADJUSTMENT_IN);
    expect(getMovementType(-5)).toBe(StockMovementType.ADJUSTMENT_OUT);
  });

  it('rounds reorder quantities to supplier pack sizes correctly', () => {
    const calculatePackOrder = (shortfall: number, packSize: number) => {
      if (shortfall <= 0) return 0;
      const packs = Math.ceil(shortfall / packSize);
      return packs * packSize;
    };

    // Shortfall 13 with pack of 10 -> 2 packs = 20 units
    expect(calculatePackOrder(13, 10)).toBe(20);

    // Shortfall 50 with pack of 25 -> 2 packs = 50 units
    expect(calculatePackOrder(50, 25)).toBe(50);

    // Zero shortfall -> 0
    expect(calculatePackOrder(0, 10)).toBe(0);
  });
});


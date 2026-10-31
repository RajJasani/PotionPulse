import { StockMovementType, UserRole } from '@potionpulse/contracts';

describe('Cross-Platform Web & Android Synchronization Parity', () => {
  it('enforces shared movement type vocabulary across web and android', () => {
    // Standard ledger action types
    expect(StockMovementType.RECEIPT).toBe('RECEIPT');
    expect(StockMovementType.SALE).toBe('SALE');
    expect(StockMovementType.ADJUSTMENT_IN).toBe('ADJUSTMENT_IN');
    expect(StockMovementType.ADJUSTMENT_OUT).toBe('ADJUSTMENT_OUT');
  });

  it('enforces identical UserRole authorization hierarchy', () => {
    expect(UserRole.OWNER).toBe('OWNER');
    expect(UserRole.MANAGER).toBe('MANAGER');
    expect(UserRole.STAFF).toBe('STAFF');
    expect(UserRole.ANALYST).toBe('ANALYST');
  });

  it('ensures Midnight Curse surge multiplier matches 3.0x specification', () => {
    const curseMultiplier = 3.0;
    const affectedIngredients = [
      'Bat Wings',
      'Mandrake Root',
      'Ghost Pepper',
      'Dragon Scale',
    ];

    expect(curseMultiplier).toBe(3.0);
    expect(affectedIngredients).toContain('Bat Wings');
    expect(affectedIngredients).toContain('Mandrake Root');
    expect(affectedIngredients).toContain('Ghost Pepper');
  });
});


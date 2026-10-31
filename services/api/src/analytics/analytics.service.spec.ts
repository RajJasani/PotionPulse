import { AnalyticsService } from './analytics.service';
import { Types } from 'mongoose';

describe('AnalyticsService — Reports, Wastage & Supplier Performance', () => {
  let service: AnalyticsService;
  const mockTenantId = new Types.ObjectId().toString();

  const mockWastage = [
    {
      ingredientId: { _id: new Types.ObjectId(), name: 'Bat Wings', baseUnit: 'pieces', costPerUnit: 1.5 },
      quantityDelta: -10, // 10 units wasted
      reason: 'Failed cauldron batch',
      occurredAt: new Date(),
    },
  ];

  const mockSupplier = {
    _id: new Types.ObjectId(),
    name: 'Shadow Realm Reagents',
    leadTimeDays: 5,
    status: 'active',
    performance: {
      onTimeDeliveryRate: 95,
      fulfillmentRate: 98,
      rating: 4.8,
    },
  };

  const mockPO = {
    _id: new Types.ObjectId(),
    supplierId: mockSupplier._id,
    status: 'received',
    totalCost: 500,
  };

  const mockMovementModel = {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockWastage),
      }),
      lean: jest.fn().mockResolvedValue(mockWastage),
    }),
  };

  const mockSupplierModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockSupplier]),
    }),
  };

  const mockPOModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockPO]),
    }),
  };

  const mockSaleModel = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
      lean: jest.fn().mockResolvedValue([{ totalAmount: 250 }, { totalAmount: 150 }]),
    }),
    aggregate: jest.fn().mockResolvedValue([{ totalRevenue: 1000, totalOrders: 20 }]),
  };

  const mockSaleItemModel = {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  };

  const mockBalanceModel = {
    aggregate: jest.fn().mockResolvedValue([{ count: 2 }]),
  };

  const mockIngredientModel = {
    countDocuments: jest.fn().mockResolvedValue(15),
  };

  beforeEach(() => {
    service = new AnalyticsService(
      mockSaleItemModel as any,
      mockSaleModel as any,
      mockBalanceModel as any,
      mockIngredientModel as any,
      mockMovementModel as any,
      mockSupplierModel as any,
      mockPOModel as any,
    );
  });

  it('should compute wastage analysis with financial loss breakdown', async () => {
    const result = await service.getWastageAnalysis(mockTenantId, 30);

    expect(result.grandTotalWastedUnits).toBe(10);
    expect(result.grandTotalCostLoss).toBe(15.0); // 10 * 1.5
    expect(result.byIngredient).toHaveLength(1);
    expect(result.byIngredient[0]?.ingredientName).toBe('Bat Wings');
  });

  it('should generate supplier performance report with fulfillment and total spend', async () => {
    const result = await service.getSupplierPerformanceReport(mockTenantId);

    expect(result.totalSuppliers).toBe(1);
    expect(result.suppliers[0]?.supplierName).toBe('Shadow Realm Reagents');
    expect(result.suppliers[0]?.totalSpend).toBe(500);
    expect(result.suppliers[0]?.performance.onTimeDeliveryRate).toBe(95);
  });

  it('should compute period-over-period growth comparisons', async () => {
    const result = await service.getPeriodOverPeriodComparison(mockTenantId, 7);

    expect(result.periodDays).toBe(7);
    expect(result.currentPeriod.revenue).toBe(400); // 250 + 150
    expect(result.comparison.revenueGrowthPercentage).toBeDefined();
  });
});

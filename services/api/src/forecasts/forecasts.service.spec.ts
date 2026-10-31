import { ForecastsService } from './forecasts.service';
import { Types } from 'mongoose';

describe('ForecastsService Integration Spec', () => {
  let service: ForecastsService;
  const mockTenantId = new Types.ObjectId().toString();
  const mockIngredientId = new Types.ObjectId().toString();

  const mockIngredient = {
    _id: new Types.ObjectId(mockIngredientId),
    name: 'Bat Wings',
    baseUnit: 'pieces',
    leadTimeDays: 5,
    safetyStock: 75,
    costPerUnit: 1.2,
  };

  const mockBalance = {
    onHand: 180,
  };

  const mockEvents = [
    {
      _id: new Types.ObjectId(),
      name: 'Midnight Curse',
      startAt: new Date('2026-10-19T00:00:00Z'),
      endAt: new Date('2026-10-21T00:00:00Z'),
      multiplier: 3.0,
      isActive: true,
    },
  ];

  const mockSales = [
    {
      _id: new Types.ObjectId(),
      soldAt: new Date('2026-10-01T12:00:00Z'),
    },
    {
      _id: new Types.ObjectId(),
      soldAt: new Date('2026-10-02T12:00:00Z'),
    },
  ];

  const mockSaleItems = [
    {
      saleId: mockSales[0]?._id,
      ingredientId: mockIngredient._id,
      quantity: 40,
    },
    {
      saleId: mockSales[1]?._id,
      ingredientId: mockIngredient._id,
      quantity: 48,
    },
  ];

  const mockForecastModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc })),
  };

  const mockIngredientModel = {
    findOne: jest.fn().mockResolvedValue(mockIngredient),
    find: jest.fn().mockResolvedValue([mockIngredient]),
  };

  const mockBalanceModel = {
    findOne: jest.fn().mockResolvedValue(mockBalance),
  };

  const mockSaleModel = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSales),
      }),
    }),
  };

  const mockSaleItemModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockSaleItems),
    }),
  };

  const mockEventModel = {
    find: jest.fn().mockResolvedValue(mockEvents),
  };

  beforeEach(() => {
    service = new ForecastsService(
      mockForecastModel as any,
      mockIngredientModel as any,
      mockBalanceModel as any,
      mockSaleModel as any,
      mockSaleItemModel as any,
      mockEventModel as any,
    );
  });

  it('should generate ingredient forecast and compute stockout risk and restock targets', async () => {
    const result = await service.generateIngredientForecast(mockTenantId, mockIngredientId, 14);

    expect(result).toBeDefined();
    expect(result.ingredientName).toBe('Bat Wings');
    expect(result.currentStock).toBe(180);
    expect(result.forecastResult.forecast).toHaveLength(14);
    expect(result.stockoutRisk.riskLevel).toBeDefined();
    expect(result.restockPlan.recommendedQuantity).toBeGreaterThanOrEqual(0);
    expect(mockForecastModel.create).toHaveBeenCalled();
  });

  it('should return tenant-wide forecast summary', async () => {
    const summary = await service.getTenantForecastSummary(mockTenantId);
    expect(summary).toHaveLength(1);
    expect(summary[0]?.ingredientName).toBe('Bat Wings');
    expect(summary[0]?.riskLevel).toBeDefined();
  });
});


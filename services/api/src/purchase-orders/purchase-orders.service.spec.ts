import { PurchaseOrdersService } from './purchase-orders.service';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('PurchaseOrdersService — Automated Reorders & Stock Receipts', () => {
  let service: PurchaseOrdersService;
  const mockTenantId = new Types.ObjectId().toString();
  const mockActorId = new Types.ObjectId().toString();
  const mockSupplierId = new Types.ObjectId().toString();
  const mockIngId = new Types.ObjectId().toString();

  const mockSupplier = {
    _id: new Types.ObjectId(mockSupplierId),
    name: 'Shadow Realm Reagents',
    leadTimeDays: 5,
    catalog: [
      { ingredientId: new Types.ObjectId(mockIngId), unitCost: 2.5, packSize: 25, moq: 50 },
    ],
    performance: {
      totalOrdersCount: 2,
      onTimeDeliveryRate: 100,
      fulfillmentRate: 100,
      rating: 5.0,
    },
    save: jest.fn().mockResolvedValue(true),
  };

  const mockIngredient = {
    _id: new Types.ObjectId(mockIngId),
    name: 'Bat Wings',
    baseUnit: 'pieces',
  };

  const mockLocation = {
    _id: new Types.ObjectId(),
    name: 'Main Apothecary Storage',
  };

  let mockPo: any;

  const mockPoModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc, save: jest.fn() })),
    findOne: jest.fn().mockImplementation(() => Promise.resolve(mockPo)),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  };

  const mockSupplierModel = {
    findOne: jest.fn().mockResolvedValue(mockSupplier),
    findById: jest.fn().mockResolvedValue(mockSupplier),
  };

  const mockIngredientModel = {
    findOne: jest.fn().mockResolvedValue(mockIngredient),
  };

  const mockBalanceModel = {
    findOneAndUpdate: jest.fn().mockResolvedValue({ onHand: 150 }),
  };

  const mockMovementModel = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  const mockLocationModel = {
    findOne: jest.fn().mockResolvedValue(mockLocation),
    create: jest.fn().mockResolvedValue(mockLocation),
  };

  const mockEventsGateway = {
    server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
    broadcastInventoryUpdate: jest.fn(),
  };

  const mockForecastsService = {
    getTenantForecastSummary: jest.fn().mockResolvedValue([
      {
        ingredientId: mockIngId,
        ingredientName: 'Bat Wings',
        unit: 'pieces',
        recommendedRestock: 100,
      },
    ]),
  };

  beforeEach(() => {
    mockPo = {
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(mockTenantId),
      supplierId: new Types.ObjectId(mockSupplierId),
      poNumber: 'PO-2026-TEST',
      status: 'submitted',
      expectedAt: new Date(Date.now() + 5 * 86400000),
      items: [
        {
          ingredientId: new Types.ObjectId(mockIngId),
          orderedQty: 100,
          receivedQty: 0,
          unitCost: 2.5,
          packSize: 25,
          subtotal: 250,
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    service = new PurchaseOrdersService(
      mockPoModel as any,
      mockSupplierModel as any,
      mockIngredientModel as any,
      mockBalanceModel as any,
      mockMovementModel as any,
      mockLocationModel as any,
      mockEventsGateway as any,
      mockForecastsService as any,
    );
  });

  it('should create a Purchase Order with calculated subtotals and pack sizes', async () => {
    const result = await service.createPO(mockTenantId, mockActorId, {
      supplierId: mockSupplierId,
      items: [
        {
          ingredientId: mockIngId,
          orderedQty: 100,
          unitCost: 2.5,
          packSize: 25,
        },
      ],
    });

    expect(result).toBeDefined();
    expect(mockPoModel.create).toHaveBeenCalled();
  });

  it('should create a recommended PO automatically seeded from AI forecast restock deficits', async () => {
    const result = await service.createRecommendedPO(mockTenantId, mockActorId, {
      supplierId: mockSupplierId,
    });

    expect(result).toBeDefined();
    expect(mockForecastsService.getTenantForecastSummary).toHaveBeenCalledWith(mockTenantId);
    expect(mockPoModel.create).toHaveBeenCalled();
  });

  it('should receive stock, update inventory balance, record movement, and update PO status to received', async () => {
    const result = await service.receiveStock(mockTenantId, mockActorId, mockPo._id.toString(), {
      receipts: [
        {
          ingredientId: mockIngId,
          quantityReceived: 100,
        },
      ],
    });

    expect(result.message).toContain('Stock received');
    expect(mockBalanceModel.findOneAndUpdate).toHaveBeenCalled();
    expect(mockMovementModel.create).toHaveBeenCalled();
    expect(mockPo.status).toBe('received');
    expect(mockPo.items[0]?.receivedQty).toBe(100);
    expect(mockEventsGateway.broadcastInventoryUpdate).toHaveBeenCalled();
  });

  it('should reject receiving stock against a draft purchase order', async () => {
    mockPo.status = 'draft';
    await expect(
      service.receiveStock(mockTenantId, mockActorId, mockPo._id.toString(), {
        receipts: [{ ingredientId: mockIngId, quantityReceived: 50 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

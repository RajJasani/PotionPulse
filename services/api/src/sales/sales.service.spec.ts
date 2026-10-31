import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SalesService } from './sales.service';
import { Sale } from './schemas/sale.schema';
import { SaleItem } from './schemas/sale-item.schema';
import { Customer } from './schemas/customer.schema';
import { Ingredient } from '../ingredients/schemas/ingredient.schema';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementType } from '@potionpulse/contracts';

describe('SalesService — Point of Sale & Customer Management', () => {
  let service: SalesService;
  const tenantId = new Types.ObjectId().toString();
  const actorId = new Types.ObjectId().toString();
  const ingredientId = new Types.ObjectId().toString();

  const mockIngredient = {
    _id: new Types.ObjectId(ingredientId),
    tenantId: new Types.ObjectId(tenantId),
    name: 'Bat Wings',
    baseUnit: 'pieces',
    costPerUnit: 2,
    archivedAt: null,
  };

  const mockCustomer = {
    _id: new Types.ObjectId(),
    name: 'Alchemist Valen',
    totalSpend: 100,
    orderCount: 2,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockSaleModel = {
    create: jest.fn().mockImplementation((docs) => docs.map((d: any) => ({ _id: new Types.ObjectId(), ...d }))),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  const mockSaleItemModel = {
    create: jest.fn().mockResolvedValue([]),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  };

  const mockCustomerModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc })),
    findOne: jest.fn().mockResolvedValue(mockCustomer),
    findById: jest.fn().mockResolvedValue(mockCustomer),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockCustomer]),
      }),
      lean: jest.fn().mockResolvedValue([mockCustomer]),
    }),
    findOneAndUpdate: jest.fn().mockResolvedValue(mockCustomer),
  };

  const mockIngredientModel = {
    findOne: jest.fn().mockResolvedValue(mockIngredient),
  };

  const mockInventoryService = {
    recordMovement: jest.fn().mockResolvedValue({
      movementId: 'mov-1',
      balanceAfter: 45,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getModelToken(Sale.name), useValue: mockSaleModel },
        { provide: getModelToken(SaleItem.name), useValue: mockSaleItemModel },
        { provide: getModelToken(Customer.name), useValue: mockCustomerModel },
        { provide: getModelToken(Ingredient.name), useValue: mockIngredientModel },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should create a sale and automatically deduct inventory balances atomically', async () => {
    const result = await service.createSale(tenantId, actorId, {
      items: [
        {
          ingredientId,
          quantity: 5,
          unitPrice: 10,
        },
      ],
      notes: 'Test sale',
    });

    expect(result.totalAmount).toBe(50);
    expect(result.itemsCount).toBe(1);
    expect(mockInventoryService.recordMovement).toHaveBeenCalledWith(
      tenantId,
      actorId,
      expect.objectContaining({
        ingredientId,
        type: StockMovementType.SALE,
        quantityDelta: -5,
      }),
    );
    expect(mockSaleItemModel.create).toHaveBeenCalled();
  });

  it('should link sale to customer and update lifetime spend and order count', async () => {
    const result = await service.createSale(tenantId, actorId, {
      customerId: mockCustomer._id.toString(),
      items: [{ ingredientId, quantity: 2, unitPrice: 25 }],
    });

    expect(result.customerId).toBe(mockCustomer._id.toString());
    expect(mockCustomer.save).toHaveBeenCalled();
  });

  it('should compute customer insights with average order value and repeat rate', async () => {
    const insights = await service.getCustomerInsights(tenantId);
    expect(insights.totalCustomers).toBe(1);
    expect(insights.topCustomers.length).toBeGreaterThan(0);
    expect(insights.repeatPurchaseRate).toBeDefined();
  });
});

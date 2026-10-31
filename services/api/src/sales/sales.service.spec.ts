import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { Sale } from './schemas/sale.schema';
import { SaleItem } from './schemas/sale-item.schema';
import { Ingredient } from '../ingredients/schemas/ingredient.schema';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementType } from '@potionpulse/contracts';
import { Types } from 'mongoose';

describe('SalesService', () => {
  let service: SalesService;

  const tenantId = new Types.ObjectId().toString();
  const actorId = new Types.ObjectId().toString();
  const ingredientId = new Types.ObjectId().toString();

  const mockIngredient = {
    _id: new Types.ObjectId(ingredientId),
    name: 'Bat Wings',
    baseUnit: 'piece',
  };

  const mockSaleModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockSaleItemModel = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockIngredientModel = {
    findOne: jest.fn(),
  };

  const mockInventoryService = {
    recordMovement: jest.fn(),
  };

  beforeEach(async () => {
    mockIngredientModel.findOne.mockResolvedValue(mockIngredient);
    mockSaleModel.create.mockImplementation((doc) => ({
      _id: new Types.ObjectId(),
      ...doc,
    }));
    mockInventoryService.recordMovement.mockResolvedValue({
      movementId: 'mov-1',
      balanceAfter: 45,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getModelToken(Sale.name), useValue: mockSaleModel },
        { provide: getModelToken(SaleItem.name), useValue: mockSaleItemModel },
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
      undefined,
    );
    expect(mockSaleItemModel.create).toHaveBeenCalled();
  });
});

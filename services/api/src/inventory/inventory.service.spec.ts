import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Location } from './schemas/location.schema';
import { InventoryBalance } from './schemas/inventory-balance.schema';
import { StockMovement } from '../movements/schemas/stock-movement.schema';
import { Ingredient } from '../ingredients/schemas/ingredient.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { AuditLog } from '../audit/schemas/audit-log.schema';
import { IdempotencyRecord } from '../common/schemas/idempotency.schema';
import { StockMovementType } from '@potionpulse/contracts';
import { Types } from 'mongoose';

describe('InventoryService', () => {
  let service: InventoryService;

  const tenantId = new Types.ObjectId().toString();
  const actorId = new Types.ObjectId().toString();
  const ingredientId = new Types.ObjectId().toString();
  const locationId = new Types.ObjectId().toString();

  const mockLocation = {
    _id: new Types.ObjectId(locationId),
    name: 'Shelf A',
    code: 'SHELF-A',
  };

  const mockIngredient = {
    _id: new Types.ObjectId(ingredientId),
    name: 'Bat Wings',
    baseUnit: 'piece',
    defaultLocationId: new Types.ObjectId(locationId),
  };

  const mockTenant = {
    _id: new Types.ObjectId(tenantId),
    settings: { allowNegativeStock: false },
  };

  const mockIdempotencyModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockIngredientModel = {
    findOne: jest.fn(),
  };

  const mockLocationModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };

  const mockTenantModel = {
    findById: jest.fn(),
  };

  const mockAuditModel = {
    create: jest.fn(),
  };

  const mockMovementModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  let mockBalance: any;
  const mockBalanceModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockRejectedValue(new Error('Transactions not supported in test mock')),
  };

  beforeEach(async () => {
    mockBalance = {
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(tenantId),
      ingredientId: new Types.ObjectId(ingredientId),
      locationId: new Types.ObjectId(locationId),
      onHand: 50,
      reserved: 0,
      version: 1,
      save: jest.fn().mockResolvedValue(true),
    };

    mockIngredientModel.findOne.mockResolvedValue(mockIngredient);
    mockLocationModel.findOne.mockResolvedValue(mockLocation);
    mockTenantModel.findById.mockResolvedValue(mockTenant);
    mockIdempotencyModel.findOne.mockResolvedValue(null);
    mockBalanceModel.findOne.mockResolvedValue(mockBalance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: getModelToken(Location.name), useValue: mockLocationModel },
        { provide: getModelToken(InventoryBalance.name), useValue: mockBalanceModel },
        { provide: getModelToken(StockMovement.name), useValue: mockMovementModel },
        { provide: getModelToken(Ingredient.name), useValue: mockIngredientModel },
        { provide: getModelToken(Tenant.name), useValue: mockTenantModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditModel },
        { provide: getModelToken(IdempotencyRecord.name), useValue: mockIdempotencyModel },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should return cached response if idempotency key already exists', async () => {
    const cachedResponse = { movementId: 'm1', balanceAfter: 50 };
    mockIdempotencyModel.findOne.mockResolvedValue({ response: cachedResponse });

    const result = await service.recordMovement(
      tenantId,
      actorId,
      {
        ingredientId,
        type: StockMovementType.RECEIPT,
        quantityDelta: 20,
        reason: 'Restock',
      },
      'idemp-key-123',
    );

    expect(result).toEqual(cachedResponse);
    expect(mockMovementModel.create).not.toHaveBeenCalled();
  });

  it('should reject movement that causes negative balance when allowNegativeStock is false', async () => {
    mockBalance.onHand = 10;

    await expect(
      service.recordMovement(tenantId, actorId, {
        ingredientId,
        type: StockMovementType.SALE,
        quantityDelta: -25, // Needs 25, only 10 available
        reason: 'Customer sale',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should correctly increment balance on receipt movement', async () => {
    mockBalance.onHand = 50;
    const createdMovement = {
      _id: new Types.ObjectId(),
      type: StockMovementType.RECEIPT,
      quantityDelta: 30,
      balanceAfter: 80,
      occurredAt: new Date(),
    };
    mockMovementModel.create.mockResolvedValue([createdMovement]);

    const result = await service.recordMovement(tenantId, actorId, {
      ingredientId,
      type: StockMovementType.RECEIPT,
      quantityDelta: 30,
      reason: 'Batch receiving',
    });

    expect(result.balanceBefore).toBe(50);
    expect(result.balanceAfter).toBe(80);
    expect(mockBalance.onHand).toBe(80);
    expect(mockBalance.save).toHaveBeenCalled();
  });
});

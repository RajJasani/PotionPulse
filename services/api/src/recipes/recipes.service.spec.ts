import { RecipesService } from './recipes.service';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('RecipesService — Potion Formulation & Batch Brewing', () => {
  let service: RecipesService;
  const mockTenantId = new Types.ObjectId().toString();
  const mockActorId = new Types.ObjectId().toString();
  const mockIng1Id = new Types.ObjectId().toString();
  const mockIng2Id = new Types.ObjectId().toString();

  const mockIng1 = {
    _id: new Types.ObjectId(mockIng1Id),
    name: 'Bat Wings',
    baseUnit: 'pieces',
    costPerUnit: 1.5,
  };

  const mockIng2 = {
    _id: new Types.ObjectId(mockIng2Id),
    name: 'Distilled Aether',
    baseUnit: 'ml',
    costPerUnit: 0.5,
  };

  let mockRecipe: any;

  const mockRecipeModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc, save: jest.fn() })),
    findOne: jest.fn().mockImplementation(() => Promise.resolve(mockRecipe)),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  };

  const mockBatchModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc })),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  };

  const mockIngredientModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockIng1, mockIng2]),
    }),
    findById: jest.fn().mockImplementation((id) => {
      if (id.toString() === mockIng1Id) return Promise.resolve(mockIng1);
      return Promise.resolve(mockIng2);
    }),
  };

  let onHandMap: Record<string, number>;

  const mockBalanceModel = {
    findOne: jest.fn().mockImplementation(({ ingredientId }) => {
      const qty = onHandMap[ingredientId.toString()] ?? 0;
      return Promise.resolve({ onHand: qty });
    }),
    findOneAndUpdate: jest.fn().mockImplementation(({ ingredientId }, { $inc }) => {
      onHandMap[ingredientId.toString()] = (onHandMap[ingredientId.toString()] ?? 0) + ($inc.onHand || 0);
      return Promise.resolve({ onHand: onHandMap[ingredientId.toString()] });
    }),
  };

  const mockMovementModel = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  const mockLocationModel = {
    findOne: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  const mockEventsGateway = {
    broadcastInventoryUpdate: jest.fn(),
  };

  beforeEach(() => {
    onHandMap = {
      [mockIng1Id]: 50,
      [mockIng2Id]: 200,
    };

    mockRecipe = {
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(mockTenantId),
      name: 'Midnight Curse Ward Draught',
      category: 'Festival',
      version: 1,
      isActive: true,
      baseYield: 10,
      yieldUnit: 'bottles',
      preparationTimeMinutes: 30,
      ingredients: [
        {
          ingredientId: new Types.ObjectId(mockIng1Id),
          ingredientName: 'Bat Wings',
          quantity: 10, // 10 wings for 10 bottles
          unit: 'pieces',
          costEstimate: 15.0,
        },
        {
          ingredientId: new Types.ObjectId(mockIng2Id),
          ingredientName: 'Distilled Aether',
          quantity: 50, // 50 ml for 10 bottles
          unit: 'ml',
          costEstimate: 25.0,
        },
      ],
      estimatedCostPerUnit: 4.0,
      suggestedRetailPrice: 15.0,
      save: jest.fn().mockResolvedValue(true),
    };

    service = new RecipesService(
      mockRecipeModel as any,
      mockBatchModel as any,
      mockIngredientModel as any,
      mockBalanceModel as any,
      mockMovementModel as any,
      mockLocationModel as any,
      mockEventsGateway as any,
    );
  });

  it('should create a new recipe and calculate estimated unit cost', async () => {
    const result = await service.createRecipe(mockTenantId, {
      name: 'Midnight Curse Ward Draught',
      baseYield: 10,
      ingredients: [
        { ingredientId: mockIng1Id, quantity: 10 },
        { ingredientId: mockIng2Id, quantity: 50 },
      ],
    });

    expect(result).toBeDefined();
    expect(mockRecipeModel.create).toHaveBeenCalled();
  });

  it('should check batch availability and scale requirements accurately', async () => {
    // Scaling by 2x: requires 20 Bat Wings and 100 ml Aether.
    // Stock is 50 Bat Wings and 200 ml Aether -> Can produce!
    const availability = await service.checkBatchAvailability(mockTenantId, mockRecipe._id.toString(), 2.0);

    expect(availability.canProduce).toBe(true);
    expect(availability.expectedYield).toBe(20);
    expect(availability.missingIngredients).toHaveLength(0);
    expect(availability.requirements[0]?.scaledRequired).toBe(20);
  });

  it('should flag insufficient stock when scaling exceeds available inventory', async () => {
    // Scaling by 10x: requires 100 Bat Wings (have only 50)
    const availability = await service.checkBatchAvailability(mockTenantId, mockRecipe._id.toString(), 10.0);

    expect(availability.canProduce).toBe(false);
    expect(availability.missingIngredients.length).toBeGreaterThan(0);
    expect(availability.missingIngredients[0]?.shortage).toBe(50);
  });

  it('should execute production brewing, deduct inventory, and record movements', async () => {
    const result = await service.executeProductionBatch(
      mockTenantId,
      mockActorId,
      mockRecipe._id.toString(),
      {
        scaleFactor: 2.0,
        actualYield: 20,
        wastage: [{ ingredientId: mockIng1Id, wastageQty: 1 }],
      },
    );

    expect(result.message).toContain('Successfully brewed 20 bottles');
    expect(mockBalanceModel.findOneAndUpdate).toHaveBeenCalled();
    expect(mockMovementModel.create).toHaveBeenCalled();
    expect(mockBatchModel.create).toHaveBeenCalled();
    expect(mockEventsGateway.broadcastInventoryUpdate).toHaveBeenCalled();
  });

  it('should reject brewing if ingredients are insufficient', async () => {
    onHandMap[mockIng1Id] = 0; // Empty stock
    await expect(
      service.executeProductionBatch(
        mockTenantId,
        mockActorId,
        mockRecipe._id.toString(),
        { scaleFactor: 1.0 },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

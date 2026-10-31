import { EventsService } from './events.service';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('EventsService — Midnight Curse & Seasonal Events', () => {
  let service: EventsService;
  const mockTenantId = new Types.ObjectId().toString();

  const mockIng1 = { _id: new Types.ObjectId(), name: 'Bat Wings', baseUnit: 'pieces', leadTimeDays: 5, safetyStock: 20 };
  const mockIng2 = { _id: new Types.ObjectId(), name: 'Mandrake Root', baseUnit: 'roots', leadTimeDays: 7, safetyStock: 15 };
  const mockIng3 = { _id: new Types.ObjectId(), name: 'Dragon Scale', baseUnit: 'scales', leadTimeDays: 14, safetyStock: 10 };

  const mockEventModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc, save: jest.fn() })),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
  };

  const mockIngredientModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockIng1, mockIng2, mockIng3]),
    }),
    countDocuments: jest.fn().mockResolvedValue(3),
    findOne: jest.fn().mockImplementation(({ _id }) => {
      if (_id.toString() === mockIng1._id.toString()) return Promise.resolve(mockIng1);
      if (_id.toString() === mockIng2._id.toString()) return Promise.resolve(mockIng2);
      return Promise.resolve(mockIng3);
    }),
  };

  const mockBalanceModel = {
    findOne: jest.fn().mockResolvedValue({ onHand: 100 }),
  };

  const mockSaleModel = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  };

  const mockSaleItemModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockEventsGateway = {
    server: {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    },
  };

  beforeEach(() => {
    service = new EventsService(
      mockEventModel as any,
      mockIngredientModel as any,
      mockBalanceModel as any,
      mockSaleModel as any,
      mockSaleItemModel as any,
      mockEventsGateway as any,
    );
  });

  it('should reject Midnight Curse setup if not exactly 3 ingredients are passed', async () => {
    await expect(
      service.setupMidnightCurseScenario(mockTenantId, {
        ingredientIds: [mockIng1._id.toString(), mockIng2._id.toString()], // Only 2
        startAt: '2026-10-19T00:00:00Z',
        endAt: '2026-10-21T23:59:59Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully configure Midnight Curse with exactly 3 ingredients and 3.0x multiplier', async () => {
    const result = await service.setupMidnightCurseScenario(mockTenantId, {
      ingredientIds: [mockIng1._id.toString(), mockIng2._id.toString(), mockIng3._id.toString()],
      startAt: '2026-10-19T00:00:00Z',
      endAt: '2026-10-21T23:59:59Z',
      multiplier: 3.0,
      name: 'Midnight Curse Festival',
    });

    expect(result).toBeDefined();
    expect(result.event.multiplier).toBe(3.0);
    expect(result.affectedIngredients).toHaveLength(3);
    expect(mockEventsGateway.server.to).toHaveBeenCalledWith(`tenant:${mockTenantId}`);
  });

  it('should calculate event impact comparing baseline vs event-adjusted stockout risk', async () => {
    const mockCreatedEvent = {
      _id: new Types.ObjectId(),
      name: 'Midnight Curse Festival',
      multiplier: 3.0,
      startAt: new Date('2026-10-19T00:00:00Z'),
      endAt: new Date('2026-10-21T23:59:59Z'),
      ingredientIds: [mockIng1._id, mockIng2._id, mockIng3._id],
      status: 'active',
    };
    mockEventModel.findOne.mockResolvedValueOnce(mockCreatedEvent);

    const impact = await service.calculateEventImpact(mockTenantId, mockCreatedEvent._id.toString());
    expect(impact.multiplier).toBe(3.0);
    expect(impact.impact).toHaveLength(3);
    expect(impact.impact[0]?.baseline).toBeDefined();
    expect(impact.impact[0]?.withEvent).toBeDefined();
    expect(impact.impact[0]?.impactDelta).toBeDefined();
  });
});

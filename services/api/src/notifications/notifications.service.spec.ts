import { NotificationsService } from './notifications.service';
import { Types } from 'mongoose';

describe('NotificationsService — In-App Alerts & Real-Time Notification', () => {
  let service: NotificationsService;
  const mockTenantId = new Types.ObjectId().toString();

  const mockNotif = {
    _id: new Types.ObjectId(),
    tenantId: new Types.ObjectId(mockTenantId),
    title: 'Low Stock: Bat Wings',
    message: 'Bat Wings has dropped below safety buffer',
    severity: 'warning',
    readAt: null,
    createdAt: new Date(),
  };

  const mockNotifModel = {
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc, save: jest.fn() })),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockNotif]),
          }),
        }),
      }),
    }),
    countDocuments: jest.fn().mockResolvedValue(1),
    findOneAndUpdate: jest.fn().mockResolvedValue({ ...mockNotif, readAt: new Date() }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockIngredientModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), name: 'Bat Wings', baseUnit: 'pieces', reorderPoint: 50 },
      ]),
    }),
  };

  const mockBalanceModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ ingredientId: new Types.ObjectId(), onHand: 20 }]),
    }),
  };

  const mockEventModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), name: 'Midnight Curse', multiplier: 3.0, ingredientIds: [new Types.ObjectId()] },
      ]),
    }),
  };

  const mockEventsGateway = {
    server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
  };

  const mockForecastsService = {
    getTenantForecastSummary: jest.fn().mockResolvedValue([
      {
        ingredientId: 'ing-1',
        ingredientName: 'Bat Wings',
        unit: 'pieces',
        daysOfCover: 2.0,
        riskLevel: 'CRITICAL',
        projectedStockoutDate: '2026-11-03',
        recommendedRestock: 400,
      },
    ]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(
      mockNotifModel as any,
      mockIngredientModel as any,
      mockBalanceModel as any,
      mockEventModel as any,
      mockEventsGateway as any,
      mockForecastsService as any,
    );
  });

  it('should create an in-app notification and broadcast via WebSocket', async () => {
    const notif = await service.createNotification(mockTenantId, {
      title: 'Low Stock Alert',
      message: 'Bat wings depleted below reorder point',
      severity: 'warning',
    });

    expect(notif).toBeDefined();
    expect(mockNotifModel.create).toHaveBeenCalled();
    expect(mockEventsGateway.server.to).toHaveBeenCalledWith(`tenant:${mockTenantId}`);
  });

  it('should deduplicate notifications with the same fingerprint created within 6 hours', async () => {
    mockNotifModel.findOne.mockResolvedValueOnce(mockNotif as any);

    const result = await service.createNotification(mockTenantId, {
      title: 'Low Stock Alert',
      message: 'Bat wings depleted below reorder point',
      fingerprint: 'fp_low_stock_bat_wings',
    });

    expect(result).toBe(mockNotif);
    expect(mockNotifModel.create).not.toHaveBeenCalled();
  });

  it('should generate automated alerts for low stock, critical forecast stockout risk, and active events', async () => {
    mockNotifModel.findOne.mockResolvedValue(null);

    const result = await service.generateAlertsForTenant(mockTenantId);

    expect(result.generatedCount).toBeGreaterThan(0);
    expect(mockForecastsService.getTenantForecastSummary).toHaveBeenCalledWith(mockTenantId);
    expect(result.notifications.some((n: any) => n.severity === 'critical')).toBe(true);
  });

  it('should mark notification as read', async () => {
    const result = await service.markAsRead(mockTenantId, mockNotif._id.toString());
    expect(result.readAt).toBeDefined();
    expect(mockNotifModel.findOneAndUpdate).toHaveBeenCalled();
  });
});

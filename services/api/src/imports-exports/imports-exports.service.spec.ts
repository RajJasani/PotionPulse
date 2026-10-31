import { ImportsExportsService } from './imports-exports.service';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('ImportsExportsService — CSV Ingestion & Report Exports', () => {
  let service: ImportsExportsService;
  const mockTenantId = new Types.ObjectId().toString();
  const mockActorId = new Types.ObjectId().toString();

  const mockIngredientModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), name: 'Bat Wings', sku: 'BW-01', baseUnit: 'pieces', costPerUnit: 1.2 },
        ]),
      }),
      lean: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), name: 'Bat Wings', sku: 'BW-01', baseUnit: 'pieces', costPerUnit: 1.2 },
      ]),
    }),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((doc) => Promise.resolve({ _id: new Types.ObjectId(), ...doc, save: jest.fn() })),
  };

  const mockBalanceModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { ingredientId: new Types.ObjectId(), onHand: 180 },
      ]),
    }),
    findOneAndUpdate: jest.fn().mockResolvedValue({ onHand: 50 }),
  };

  const mockMovementModel = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  const mockLocationModel = {
    findOne: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  const mockForecastsService = {
    getTenantForecastSummary: jest.fn().mockResolvedValue([
      {
        ingredientId: 'ing-1',
        ingredientName: 'Bat Wings',
        unit: 'pieces',
        currentStock: 180,
        daysOfCover: 4.1,
        riskLevel: 'CRITICAL',
        projectedStockoutDate: '2026-11-03',
        recommendedRestock: 400,
        recommendedOrderDate: '2026-10-31',
        modelUsed: 'HoltWinters_Additive',
      },
    ]),
  };

  beforeEach(() => {
    service = new ImportsExportsService(
      mockIngredientModel as any,
      mockBalanceModel as any,
      mockMovementModel as any,
      mockLocationModel as any,
      mockForecastsService as any,
    );
  });

  it('should preview CSV, detect duplicates by SKU, and report validation errors', async () => {
    const csv = `name,sku,category,baseUnit,currentStock,costPerUnit
Dragon Scale,DS-01,Reagents,scales,15,45.0
Bat Wings,BW-01,Reagents,pieces,50,1.2
,INVALID-01,Reagents,pieces,10,2.0
Ghost Pepper,GP-01,Spices,grams,-5,1.0`;

    const preview: any = await service.processIngredientCsv(mockTenantId, mockActorId, {
      rawCsv: csv,
      dryRun: true,
    });

    expect(preview.dryRun).toBe(true);
    expect(preview.duplicateCount).toBe(1); // BW-01 already in catalog
    expect(preview.errorCount).toBe(2); // Missing name & negative stock
    expect(preview.errors[0]?.field).toBe('name');
    expect(preview.errors[1]?.field).toBe('currentStock');
  });

  it('should execute CSV import and initialize stock balances and movements', async () => {
    const csv = `name,sku,category,baseUnit,currentStock,costPerUnit
Dragon Scale,DS-01,Reagents,scales,15,45.0`;

    const result: any = await service.processIngredientCsv(mockTenantId, mockActorId, {
      rawCsv: csv,
      dryRun: false,
    });

    expect(result.dryRun).toBe(false);
    expect(result.createdCount).toBe(1);
    expect(mockIngredientModel.create).toHaveBeenCalled();
    expect(mockBalanceModel.findOneAndUpdate).toHaveBeenCalled();
    expect(mockMovementModel.create).toHaveBeenCalled();
  });

  it('should reject malformed CSV without header row', async () => {
    await expect(
      service.processIngredientCsv(mockTenantId, mockActorId, {
        rawCsv: 'SingleLineNoData',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should export inventory positions into formatted CSV', async () => {
    const csv = await service.exportInventoryCsv(mockTenantId);
    expect(csv).toContain('SKU,Name,Category,Base Unit,On Hand,Cost Per Unit');
    expect(csv).toContain('"Bat Wings"');
  });

  it('should export AI demand forecasts into downloadable CSV', async () => {
    const csv = await service.exportForecastsCsv(mockTenantId);
    expect(csv).toContain('Ingredient Name,Base Unit,Current Stock,Days of Cover,Risk Level');
    expect(csv).toContain('"HoltWinters_Additive"');
  });
});

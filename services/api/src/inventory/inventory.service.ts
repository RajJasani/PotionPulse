import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { InventoryBalance, InventoryBalanceDocument } from './schemas/inventory-balance.schema';
import { StockMovement, StockMovementDocument } from '../movements/schemas/stock-movement.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { AuditLog, AuditLogDocument } from '../audit/schemas/audit-log.schema';
import { IdempotencyRecord, IdempotencyRecordDocument } from '../common/schemas/idempotency.schema';
import { CreateLocationDto } from './dto/location.dto';
import { CreateMovementDto } from './dto/movement.dto';
import { EventsGateway } from '../events/events.gateway';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class InventoryService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(InventoryBalance.name) private balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    @InjectModel(IdempotencyRecord.name) private idempotencyModel: Model<IdempotencyRecordDocument>,
    @Optional() private readonly eventsGateway?: EventsGateway,
  ) {}

  async createLocation(tenantId: string, dto: CreateLocationDto) {
    const tid = new Types.ObjectId(tenantId);
    const existing = await this.locationModel.findOne({
      tenantId: tid,
      code: dto.code.toUpperCase(),
    });

    if (existing) {
      throw new ConflictException(`A location with code '${dto.code}' already exists`);
    }

    if (dto.isDefault) {
      // Clear previous default
      await this.locationModel.updateMany({ tenantId: tid }, { isDefault: false });
    }

    const loc = await this.locationModel.create({
      tenantId: tid,
      name: dto.name,
      code: dto.code.toUpperCase(),
      type: dto.type || 'shelf',
      isDefault: !!dto.isDefault,
    });

    return {
      id: loc._id.toString(),
      name: loc.name,
      code: loc.code,
      type: loc.type,
      isDefault: loc.isDefault,
      createdAt: loc.createdAt,
    };
  }

  async getLocations(tenantId: string) {
    const locs = await this.locationModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ isDefault: -1, name: 1 })
      .lean();

    return locs.map((l) => ({
      id: l._id.toString(),
      name: l.name,
      code: l.code,
      type: l.type,
      isDefault: l.isDefault,
      createdAt: l.createdAt,
    }));
  }

  async getBalances(tenantId: string, query: { ingredientId?: string; locationId?: string }) {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (query.ingredientId && Types.ObjectId.isValid(query.ingredientId)) {
      filter.ingredientId = new Types.ObjectId(query.ingredientId);
    }
    if (query.locationId && Types.ObjectId.isValid(query.locationId)) {
      filter.locationId = new Types.ObjectId(query.locationId);
    }

    const balances = await this.balanceModel
      .find(filter)
      .populate('ingredientId', 'name sku baseUnit reorderPoint safetyStock')
      .populate('locationId', 'name code type')
      .lean();

    return balances.map((b) => {
      const ing = b.ingredientId as any;
      const loc = b.locationId as any;
      return {
        id: b._id.toString(),
        ingredientId: ing?._id?.toString(),
        ingredientName: ing?.name,
        ingredientSku: ing?.sku,
        baseUnit: ing?.baseUnit,
        locationId: loc?._id?.toString(),
        locationName: loc?.name,
        locationCode: loc?.code,
        onHand: b.onHand,
        reserved: b.reserved,
        available: b.onHand - b.reserved,
        version: b.version,
        updatedAt: b.updatedAt,
      };
    });
  }

  async recordMovement(
    tenantId: string,
    actorId: string,
    dto: CreateMovementDto,
    headerIdempotencyKey?: string,
  ) {
    const idempKey = headerIdempotencyKey || dto.idempotencyKey;
    const tid = new Types.ObjectId(tenantId);
    const aid = new Types.ObjectId(actorId);

    // 1. Check idempotency
    if (idempKey) {
      const existingRecord = await this.idempotencyModel.findOne({
        tenantId: tid,
        key: idempKey,
      });

      if (existingRecord) {
        return existingRecord.response;
      }
    }

    // 2. Validate ingredient
    if (!Types.ObjectId.isValid(dto.ingredientId)) {
      throw new BadRequestException('Invalid ingredient ID format');
    }
    const ingredient = await this.ingredientModel.findOne({
      _id: new Types.ObjectId(dto.ingredientId),
      tenantId: tid,
    });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found in this shop workspace');
    }

    // 3. Resolve location
    let locationId: Types.ObjectId;
    if (dto.locationId && Types.ObjectId.isValid(dto.locationId)) {
      locationId = new Types.ObjectId(dto.locationId);
      const loc = await this.locationModel.findOne({ _id: locationId, tenantId: tid });
      if (!loc) throw new NotFoundException('Location not found in this shop workspace');
    } else if (ingredient.defaultLocationId) {
      locationId = ingredient.defaultLocationId;
    } else {
      const defaultLoc = await this.locationModel.findOne({ tenantId: tid, isDefault: true });
      if (!defaultLoc) {
        throw new BadRequestException('No storage location specified and no default location found');
      }
      locationId = defaultLoc._id as Types.ObjectId;
    }

    // 4. Check tenant negative stock policy
    const tenant = await this.tenantModel.findById(tid);
    const allowNegativeStock = !!tenant?.settings?.allowNegativeStock;

    // Use transaction if supported by MongoDB deployment
    let session = null;
    let useTransaction = false;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch {
      // Standalone MongoDB without replica set
      session = null;
      useTransaction = false;
    }

    try {
      // Find or initialize balance
      let balance = await this.balanceModel.findOne(
        { tenantId: tid, ingredientId: ingredient._id, locationId },
        null,
        session ? { session } : {},
      );

      if (!balance) {
        const created = await this.balanceModel.create(
          [
            {
              tenantId: tid,
              ingredientId: ingredient._id,
              locationId,
              onHand: 0,
              reserved: 0,
              version: 1,
            },
          ],
          session ? { session } : {},
        );
        const first = created[0];
        if (!first) throw new BadRequestException('Failed to initialize balance record');
        balance = first;
      }

      const balanceBefore = balance.onHand;
      const balanceAfter = balanceBefore + dto.quantityDelta;

      if (balanceAfter < 0 && !allowNegativeStock) {
        throw new BadRequestException(
          `Insufficient stock: operation requires ${Math.abs(dto.quantityDelta)} ${dto.unit || ingredient.baseUnit}, but only ${balanceBefore} is on hand.`,
        );
      }

      // Create immutable movement record
      const movementDocs = await this.movementModel.create(
        [
          {
            tenantId: tid,
            ingredientId: ingredient._id,
            locationId,
            type: dto.type,
            quantityDelta: dto.quantityDelta,
            unit: dto.unit || ingredient.baseUnit,
            balanceAfter,
            reason: dto.reason,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            idempotencyKey: idempKey,
            actorId: aid,
            occurredAt: new Date(),
          },
        ],
        session ? { session } : {},
      );
      const movement = movementDocs[0];
      if (!movement) {
        throw new BadRequestException('Failed to create stock movement record');
      }

      // Update balance with version increment
      balance.onHand = balanceAfter;
      balance.version += 1;
      await balance.save(session ? { session } : {});

      // Record audit event
      await this.auditModel.create(
        [
          {
            tenantId: tid,
            actorId: aid,
            action: 'STOCK_MOVEMENT',
            entityType: 'InventoryBalance',
            entityId: balance._id.toString(),
            beforeSummary: { onHand: balanceBefore, version: balance.version - 1 },
            afterSummary: {
              onHand: balanceAfter,
              version: balance.version,
              movementId: movement._id.toString(),
              type: dto.type,
              quantityDelta: dto.quantityDelta,
            },
          },
        ],
        session ? { session } : {},
      );

      const result = {
        movementId: movement._id.toString(),
        ingredientId: ingredient._id.toString(),
        ingredientName: ingredient.name,
        locationId: locationId.toString(),
        type: movement.type,
        quantityDelta: movement.quantityDelta,
        unit: movement.unit,
        balanceBefore,
        balanceAfter,
        version: balance.version,
        occurredAt: movement.occurredAt,
      };

      // Store idempotency record
      if (idempKey) {
        await this.idempotencyModel.create(
          [
            {
              tenantId: tid,
              key: idempKey,
              operation: 'STOCK_MOVEMENT',
              requestHash: `${dto.ingredientId}:${dto.quantityDelta}:${dto.type}`,
              response: result,
              statusCode: 201,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
          session ? { session } : {},
        );
      }

      if (useTransaction && session) {
        await session.commitTransaction();
      }

      // Broadcast committed change in real-time to active tenant room
      this.eventsGateway?.broadcastInventoryUpdate(tenantId, result);

      return result;
    } catch (err) {
      if (useTransaction && session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  async getMovements(
    tenantId: string,
    query: {
      ingredientId?: string;
      locationId?: string;
      type?: StockMovementType;
      page?: number;
      limit?: number;
    },
  ) {
    const tid = new Types.ObjectId(tenantId);
    const filter: Record<string, unknown> = { tenantId: tid };

    if (query.ingredientId && Types.ObjectId.isValid(query.ingredientId)) {
      filter.ingredientId = new Types.ObjectId(query.ingredientId);
    }
    if (query.locationId && Types.ObjectId.isValid(query.locationId)) {
      filter.locationId = new Types.ObjectId(query.locationId);
    }
    if (query.type) {
      filter.type = query.type;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      this.movementModel
        .find(filter)
        .populate('ingredientId', 'name sku baseUnit')
        .populate('locationId', 'name code')
        .populate('actorId', 'displayName email')
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.movementModel.countDocuments(filter),
    ]);

    return {
      items: movements.map((m) => {
        const ing = m.ingredientId as any;
        const loc = m.locationId as any;
        const actor = m.actorId as any;
        return {
          id: m._id.toString(),
          ingredientId: ing?._id?.toString(),
          ingredientName: ing?.name,
          ingredientSku: ing?.sku,
          locationId: loc?._id?.toString(),
          locationName: loc?.name,
          locationCode: loc?.code,
          type: m.type,
          quantityDelta: m.quantityDelta,
          unit: m.unit,
          balanceAfter: m.balanceAfter,
          reason: m.reason,
          referenceType: m.referenceType,
          referenceId: m.referenceId,
          actor: {
            id: actor?._id?.toString(),
            displayName: actor?.displayName,
            email: actor?.email,
          },
          occurredAt: m.occurredAt,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { SaleItem, SaleItemDocument } from './schemas/sale-item.schema';
import { InventoryService } from '../inventory/inventory.service';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { CreateSaleDto, RefundSaleDto } from './dto/sale.dto';
import { EventsGateway } from '../events/events.gateway';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private saleItemModel: Model<SaleItemDocument>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>,
    private inventoryService: InventoryService,
    @Optional() private readonly eventsGateway?: EventsGateway,
  ) {}

  private generateSaleNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SALE-${dateStr}-${rand}`;
  }

  async createSale(
    tenantId: string,
    actorId: string,
    dto: CreateSaleDto,
    headerIdempotencyKey?: string,
  ) {
    const tid = new Types.ObjectId(tenantId);
    const aid = new Types.ObjectId(actorId);
    const saleNumber = dto.saleNumber || this.generateSaleNumber();

    // 1. Validate all ingredients and calculate total
    let totalAmount = 0;
    const itemRecords: Array<{
      ingredientId: Types.ObjectId;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      name: string;
      baseUnit: string;
    }> = [];

    for (const item of dto.items) {
      if (!Types.ObjectId.isValid(item.ingredientId)) {
        throw new BadRequestException(`Invalid ingredient ID format: ${item.ingredientId}`);
      }

      const ing = await this.ingredientModel.findOne({
        _id: new Types.ObjectId(item.ingredientId),
        tenantId: tid,
      });

      if (!ing) {
        throw new NotFoundException(`Ingredient with ID ${item.ingredientId} not found`);
      }

      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;

      itemRecords.push({
        ingredientId: ing._id as Types.ObjectId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
        name: ing.name,
        baseUnit: ing.baseUnit,
      });
    }

    // 2. Create the Sale header
    const sale = await this.saleModel.create({
      tenantId: tid,
      saleNumber,
      status: 'completed',
      totalAmount,
      currency: 'USD',
      actorId: aid,
      soldAt: new Date(),
      notes: dto.notes,
    });

    // 3. Atomically deduct inventory for each item and record movements
    const movements = [];
    for (const item of itemRecords) {
      const movement = await this.inventoryService.recordMovement(
        tenantId,
        actorId,
        {
          ingredientId: item.ingredientId.toString(),
          type: StockMovementType.SALE,
          quantityDelta: -item.quantity, // Negative delta reduces stock
          unit: item.baseUnit,
          reason: `Sale deduction for ${saleNumber}`,
          referenceType: 'sale',
          referenceId: sale._id.toString(),
        },
        headerIdempotencyKey ? `${headerIdempotencyKey}-${item.ingredientId.toString()}` : undefined,
      );

      movements.push(movement);

      await this.saleItemModel.create({
        tenantId: tid,
        saleId: sale._id,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      });
    }

    const result = {
      id: sale._id.toString(),
      saleNumber: sale.saleNumber,
      status: sale.status,
      totalAmount: sale.totalAmount,
      currency: sale.currency,
      itemsCount: itemRecords.length,
      soldAt: sale.soldAt,
      items: itemRecords.map((item) => ({
        ingredientId: item.ingredientId.toString(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      movements,
    };

    this.eventsGateway?.broadcastSaleCompleted(tenantId, result);

    return result;
  }

  async getSales(tenantId: string, query: { page?: number; limit?: number }) {
    const tid = new Types.ObjectId(tenantId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      this.saleModel
        .find({ tenantId: tid })
        .sort({ soldAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'displayName email')
        .lean(),
      this.saleModel.countDocuments({ tenantId: tid }),
    ]);

    return {
      items: sales.map((s) => {
        const actor = s.actorId as any;
        return {
          id: s._id.toString(),
          saleNumber: s.saleNumber,
          status: s.status,
          totalAmount: s.totalAmount,
          currency: s.currency,
          soldAt: s.soldAt,
          notes: s.notes,
          actor: {
            id: actor?._id?.toString(),
            displayName: actor?.displayName,
          },
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

  async getSaleById(tenantId: string, saleId: string) {
    if (!Types.ObjectId.isValid(saleId)) {
      throw new BadRequestException('Invalid sale ID format');
    }

    const tid = new Types.ObjectId(tenantId);
    const sale = await this.saleModel
      .findOne({ _id: new Types.ObjectId(saleId), tenantId: tid })
      .populate('actorId', 'displayName email');

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const items = await this.saleItemModel
      .find({ saleId: sale._id, tenantId: tid })
      .populate('ingredientId', 'name sku baseUnit');

    const actor = sale.actorId as any;

    return {
      id: sale._id.toString(),
      saleNumber: sale.saleNumber,
      status: sale.status,
      totalAmount: sale.totalAmount,
      currency: sale.currency,
      soldAt: sale.soldAt,
      notes: sale.notes,
      actor: {
        id: actor?._id?.toString(),
        displayName: actor?.displayName,
      },
      items: items.map((i) => {
        const ing = i.ingredientId as any;
        return {
          id: i._id.toString(),
          ingredientId: ing?._id?.toString(),
          ingredientName: ing?.name,
          ingredientSku: ing?.sku,
          baseUnit: ing?.baseUnit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        };
      }),
    };
  }

  async refundSale(tenantId: string, actorId: string, saleId: string, dto: RefundSaleDto) {
    if (!Types.ObjectId.isValid(saleId)) {
      throw new BadRequestException('Invalid sale ID format');
    }

    const tid = new Types.ObjectId(tenantId);
    const sale = await this.saleModel.findOne({ _id: new Types.ObjectId(saleId), tenantId: tid });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status === 'refunded') {
      throw new BadRequestException('Sale has already been refunded');
    }

    sale.status = 'refunded';
    await sale.save();

    const items = await this.saleItemModel.find({ saleId: sale._id, tenantId: tid });
    const restockMovements = [];

    // PRD rule FR-SALE-04: Compensating stock movements only when returned goods are actually restocked
    if (dto.restock) {
      for (const item of items) {
        const movement = await this.inventoryService.recordMovement(tenantId, actorId, {
          ingredientId: item.ingredientId.toString(),
          type: StockMovementType.RETURN,
          quantityDelta: item.quantity, // Positive delta returns stock
          reason: `Restock refund for ${sale.saleNumber}: ${dto.reason}`,
          referenceType: 'reversal',
          referenceId: sale._id.toString(),
        });
        restockMovements.push(movement);
      }
    }

    return {
      id: sale._id.toString(),
      saleNumber: sale.saleNumber,
      status: sale.status,
      restocked: dto.restock,
      refundReason: dto.reason,
      restockMovements,
    };
  }
}

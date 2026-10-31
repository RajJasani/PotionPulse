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
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { InventoryService } from '../inventory/inventory.service';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { CreateCustomerDto, CreateSaleDto, RefundSaleDto, UpdateCustomerDto } from './dto/sale.dto';
import { EventsGateway } from '../events/events.gateway';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private saleItemModel: Model<SaleItemDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
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

    // Check optional customer
    let customerObj: any = null;
    if (dto.customerId) {
      customerObj = await this.customerModel.findOne({ _id: new Types.ObjectId(dto.customerId), tenantId: tid });
      if (!customerObj) {
        throw new BadRequestException(`Customer ${dto.customerId} not found`);
      }
    }

    // 1. Validate all ingredients and calculate total
    let totalAmount = 0;
    const itemRecords: Array<{
      ingredientId: Types.ObjectId;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      name: string;
      baseUnit: string;
      recipeVersionId?: Types.ObjectId;
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
        throw new NotFoundException(`Ingredient not found: ${item.ingredientId}`);
      }

      if (ing.archivedAt) {
        throw new BadRequestException(`Ingredient ${ing.name} is archived and cannot be sold`);
      }

      const subtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      totalAmount += subtotal;

      itemRecords.push({
        ingredientId: ing._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
        name: ing.name,
        baseUnit: ing.baseUnit,
        recipeVersionId: item.recipeId ? new Types.ObjectId(item.recipeId) : undefined,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    // 2. Create the Sale record
    const [sale] = await this.saleModel.create(
      [
        {
          tenantId: tid,
          saleNumber,
          status: 'completed',
          paymentStatus: 'paid',
          totalAmount,
          currency: 'USD',
          actorId: aid,
          customerId: customerObj ? customerObj._id : undefined,
          soldAt: new Date(),
          notes: dto.notes,
        },
      ],
      {},
    );

    if (!sale) {
      throw new BadRequestException('Failed to create sale record');
    }

    // 3. Create SaleItem records
    const saleItemDocs = itemRecords.map((item) => ({
      tenantId: tid,
      saleId: sale._id,
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      recipeVersionId: item.recipeVersionId,
    }));

    await this.saleItemModel.create(saleItemDocs);

    // 4. Record stock movements (decrement onHand) for each sold item
    const movements = [];
    const baseKey = dto.idempotencyKey || headerIdempotencyKey || `sale-${sale._id.toString()}`;

    for (let i = 0; i < itemRecords.length; i++) {
      const item = itemRecords[i]!;
      const itemKey = `${baseKey}-item-${i}`;

      const movement = await this.inventoryService.recordMovement(
        tenantId,
        actorId,
        {
          ingredientId: item.ingredientId.toString(),
          type: StockMovementType.SALE,
          quantityDelta: -item.quantity, // Negative delta decrements stock
          reason: `Sale ${sale.saleNumber}: ${item.name} (${item.quantity} ${item.baseUnit})`,
          referenceType: 'sale',
          referenceId: sale._id.toString(),
          idempotencyKey: itemKey,
        },
      );
      movements.push(movement);
    }

    // 5. Update customer metrics if customer linked
    if (customerObj) {
      customerObj.totalSpend = Math.round((customerObj.totalSpend + totalAmount) * 100) / 100;
      customerObj.orderCount += 1;
      await customerObj.save();
    }

    // 6. Broadcast via WebSocket if gateway is available
    if (this.eventsGateway) {
      this.eventsGateway.broadcastSaleCompleted(tenantId, {
        saleId: sale._id.toString(),
        saleNumber: sale.saleNumber,
        totalAmount: sale.totalAmount,
        itemCount: itemRecords.length,
        customerId: customerObj ? customerObj._id.toString() : null,
      });
    }

    return {
      id: sale._id.toString(),
      saleNumber: sale.saleNumber,
      status: sale.status,
      paymentStatus: sale.paymentStatus,
      totalAmount: sale.totalAmount,
      currency: sale.currency,
      customerId: customerObj ? customerObj._id.toString() : null,
      customerName: customerObj ? customerObj.name : null,
      soldAt: sale.soldAt,
      notes: sale.notes,
      itemsCount: itemRecords.length,
      items: itemRecords.map((item) => ({
        ingredientId: item.ingredientId.toString(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        baseUnit: item.baseUnit,
      })),
      movementsCount: movements.length,
    };
  }

  async getSales(
    tenantId: string,
    query: {
      startDate?: string;
      endDate?: string;
      customerId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const tid = new Types.ObjectId(tenantId);
    const filter: Record<string, unknown> = { tenantId: tid };

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter.$gte = new Date(query.startDate);
      if (query.endDate) dateFilter.$lte = new Date(query.endDate);
      filter.soldAt = dateFilter;
    }

    if (query.customerId && Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new Types.ObjectId(query.customerId);
    }

    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = Math.max(0, Number(query.offset) || 0);

    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('customerId', 'name email phone tier')
        .sort({ soldAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      this.saleModel.countDocuments(filter),
    ]);

    return {
      data: sales,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + sales.length < total,
      },
    };
  }

  async getSaleById(tenantId: string, saleId: string): Promise<any> {
    if (!Types.ObjectId.isValid(saleId)) {
      throw new BadRequestException('Invalid sale ID format');
    }

    const tid = new Types.ObjectId(tenantId);
    const sale = await this.saleModel
      .findOne({ _id: new Types.ObjectId(saleId), tenantId: tid })
      .populate('customerId', 'name email phone tier totalSpend')
      .lean();

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const items = await this.saleItemModel
      .find({ saleId: sale._id, tenantId: tid })
      .populate('ingredientId', 'name sku baseUnit')
      .lean();

    return {
      ...sale,
      items,
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
    sale.paymentStatus = 'refunded';
    await sale.save();

    // Deduct customer spend if linked
    if (sale.customerId) {
      const customer = await this.customerModel.findById(sale.customerId);
      if (customer) {
        customer.totalSpend = Math.max(0, Math.round((customer.totalSpend - sale.totalAmount) * 100) / 100);
        await customer.save();
      }
    }

    const items = await this.saleItemModel.find({ saleId: sale._id, tenantId: tid });
    const restockMovements = [];

    // PRD rule FR-SALE-04: Compensating stock movements only when returned goods are actually restocked
    if (dto.restock) {
      for (const item of items) {
        const movement = await this.inventoryService.recordMovement(tenantId, actorId, {
          ingredientId: item.ingredientId.toString(),
          type: StockMovementType.RETURN,
          quantityDelta: item.quantity,
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

  // --- Customer Management & Insights ---

  async createCustomer(tenantIdStr: string, dto: CreateCustomerDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    return this.customerModel.create({
      tenantId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      tier: dto.tier || 'standard',
      notes: dto.notes,
      totalSpend: 0,
      orderCount: 0,
    });
  }

  async listCustomers(tenantIdStr: string, tier?: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const filter: Record<string, unknown> = { tenantId };
    if (tier) filter.tier = tier;
    return this.customerModel.find(filter).sort({ totalSpend: -1 }).lean();
  }

  async getCustomer(tenantIdStr: string, customerId: string): Promise<any> {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(customerId), tenantId })
      .lean();

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    const orders = await this.saleModel
      .find({ tenantId, customerId: customer._id })
      .sort({ soldAt: -1 })
      .limit(15)
      .lean();

    return {
      ...customer,
      recentOrders: orders,
    };
  }

  async updateCustomer(tenantIdStr: string, customerId: string, dto: UpdateCustomerDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const customer = await this.customerModel.findOneAndUpdate(
      { _id: new Types.ObjectId(customerId), tenantId },
      { $set: dto },
      { new: true },
    );
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    return customer;
  }

  async getCustomerInsights(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const customers = await this.customerModel.find({ tenantId }).lean();
    const totalCustomers = customers.length;
    const totalRevenueFromCustomers = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0);

    const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenueFromCustomers / totalOrders) * 100) / 100 : 0;
    const topCustomers = [...customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

    const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;
    const repeatPurchaseRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      totalOrders,
      totalRevenueFromCustomers: Math.round(totalRevenueFromCustomers * 100) / 100,
      averageOrderValue,
      repeatPurchaseRate: `${repeatPurchaseRate}%`,
      topCustomers: topCustomers.map((c) => ({
        id: c._id,
        name: c.name,
        tier: c.tier,
        totalSpend: c.totalSpend,
        orderCount: c.orderCount,
      })),
    };
  }
}

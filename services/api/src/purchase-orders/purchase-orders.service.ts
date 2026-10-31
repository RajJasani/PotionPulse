import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PurchaseOrder, PurchaseOrderDocument, PurchaseOrderItem } from './schemas/purchase-order.schema';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { StockMovement, StockMovementDocument } from '../movements/schemas/stock-movement.schema';
import { Location, LocationDocument } from '../inventory/schemas/location.schema';
import { EventsGateway } from '../events/events.gateway';
import { ForecastsService } from '../forecasts/forecasts.service';
import {
  CreatePurchaseOrderDto,
  CreateRecommendedPODto,
  ReceivePurchaseOrderDto,
} from './dto/purchase-order.dto';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name) private readonly poModel: Model<PurchaseOrderDocument>,
    @InjectModel(Supplier.name) private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(StockMovement.name) private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly forecastsService: ForecastsService,
  ) {}

  async createPO(tenantIdStr: string, actorIdStr: string, dto: CreatePurchaseOrderDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const supplierId = new Types.ObjectId(dto.supplierId);
    const createdBy = new Types.ObjectId(actorIdStr);

    const supplier = await this.supplierModel.findOne({ _id: supplierId, tenantId });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase order must contain at least one item');
    }

    const items: PurchaseOrderItem[] = [];
    let totalCost = 0;

    for (const itm of dto.items) {
      const ingId = new Types.ObjectId(itm.ingredientId);
      const ingredient = await this.ingredientModel.findOne({ _id: ingId, tenantId });
      if (!ingredient) {
        throw new BadRequestException(`Ingredient ${itm.ingredientId} not found`);
      }

      const packSize = Math.max(1, itm.packSize || 1);
      const subtotal = Math.round(itm.orderedQty * itm.unitCost * 100) / 100;
      totalCost += subtotal;

      items.push({
        ingredientId: ingId,
        ingredientName: ingredient.name,
        unit: ingredient.baseUnit,
        orderedQty: itm.orderedQty,
        receivedQty: 0,
        unitCost: itm.unitCost,
        packSize,
        subtotal,
      });
    }

    const poNumber = dto.poNumber || `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const expectedAt = dto.expectedAt
      ? new Date(dto.expectedAt)
      : new Date(Date.now() + (supplier.leadTimeDays || 3) * 86400000);

    return this.poModel.create({
      tenantId,
      supplierId,
      poNumber,
      status: 'draft',
      expectedAt,
      totalCost: Math.round(totalCost * 100) / 100,
      items,
      createdBy,
      notes: dto.notes,
    });
  }

  /**
   * Generates a recommended Purchase Order based on current stockout deficits and AI forecasts
   */
  async createRecommendedPO(tenantIdStr: string, actorIdStr: string, dto: CreateRecommendedPODto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const supplierId = new Types.ObjectId(dto.supplierId);

    const supplier = await this.supplierModel.findOne({ _id: supplierId, tenantId });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
    }

    const forecastSummaries = await this.forecastsService.getTenantForecastSummary(tenantIdStr);
    const poItems: PurchaseOrderItem[] = [];
    let totalCost = 0;

    for (const fc of forecastSummaries) {
      // Check if this ingredient is supplied by this vendor
      const catalogEntry = (supplier.catalog || []).find(
        (c) => c.ingredientId.toString() === fc.ingredientId.toString(),
      );

      // If reorder recommended or catalog exists
      if (fc.recommendedRestock > 0 && catalogEntry) {
        const unitCost = catalogEntry.unitCost || 0;
        const packSize = catalogEntry.packSize || 1;
        const subtotal = Math.round(fc.recommendedRestock * unitCost * 100) / 100;
        totalCost += subtotal;

        poItems.push({
          ingredientId: new Types.ObjectId(fc.ingredientId),
          ingredientName: fc.ingredientName,
          unit: fc.unit,
          orderedQty: fc.recommendedRestock,
          receivedQty: 0,
          unitCost,
          packSize,
          subtotal,
        });
      }
    }

    if (poItems.length === 0) {
      throw new BadRequestException('No items from this supplier currently require restocking based on demand forecast.');
    }

    const poNumber = `PO-REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expectedAt = new Date(Date.now() + (supplier.leadTimeDays || 3) * 86400000);

    return this.poModel.create({
      tenantId,
      supplierId,
      poNumber,
      status: 'draft',
      expectedAt,
      totalCost: Math.round(totalCost * 100) / 100,
      items: poItems,
      createdBy: new Types.ObjectId(actorIdStr),
      notes: dto.notes || 'Automated recommended purchase order from AI inventory optimization engine',
    });
  }

  async submitPO(tenantIdStr: string, poId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const po = await this.poModel.findOne({ _id: new Types.ObjectId(poId), tenantId });
    if (!po) {
      throw new NotFoundException(`Purchase order ${poId} not found`);
    }

    if (po.status !== 'draft') {
      throw new BadRequestException(`Cannot submit purchase order with status '${po.status}'`);
    }

    po.status = 'submitted';
    po.submittedAt = new Date();
    await po.save();

    this.eventsGateway.server?.to(`tenant:${tenantIdStr}`).emit('po:submitted', {
      tenantId: tenantIdStr,
      poId: po._id,
      poNumber: po.poNumber,
    });

    return po;
  }

  /**
   * Receives stock against a purchase order:
   * 1. Updates received quantity on PO items.
   * 2. Automatically creates a StockMovement (RECEIPT).
   * 3. Atomically increments inventory balance on-hand.
   * 4. Updates PO status (partially_received or received).
   * 5. Updates vendor delivery performance metrics.
   */
  async receiveStock(tenantIdStr: string, _actorIdStr: string, poId: string, dto: ReceivePurchaseOrderDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const po = await this.poModel.findOne({ _id: new Types.ObjectId(poId), tenantId });
    if (!po) {
      throw new NotFoundException(`Purchase order ${poId} not found`);
    }

    if (po.status === 'draft') {
      throw new BadRequestException('Cannot receive items against a draft purchase order. Please submit it first.');
    }
    if (po.status === 'received' || po.status === 'cancelled') {
      throw new BadRequestException(`Cannot receive items for purchase order in '${po.status}' state.`);
    }

    // Default location for stock placement
    let defaultLocation = await this.locationModel.findOne({ tenantId });
    if (!defaultLocation) {
      defaultLocation = await this.locationModel.create({
        tenantId,
        name: 'Main Apothecary Storage',
        type: 'STORAGE',
      });
    }

    for (const receipt of dto.receipts) {
      const item = po.items.find((i) => i.ingredientId.toString() === receipt.ingredientId);
      if (!item) {
        throw new BadRequestException(`Ingredient ${receipt.ingredientId} does not exist in PO ${po.poNumber}`);
      }

      const receivedQty = Math.max(0, receipt.quantityReceived);
      if (receivedQty === 0) continue;

      item.receivedQty += receivedQty;

      // Update Inventory Balance atomically
      const balance = await this.balanceModel.findOneAndUpdate(
        { tenantId, ingredientId: item.ingredientId, locationId: defaultLocation._id },
        {
          $inc: { onHand: receivedQty, version: 1 },
          $setOnInsert: { reserved: 0 },
        },
        { upsert: true, new: true }
      );

      // Record Stock Movement (RECEIPT)
      await this.movementModel.create({
        tenantId,
        ingredientId: item.ingredientId,
        locationId: defaultLocation._id,
        type: StockMovementType.RECEIPT,
        quantityDelta: receivedQty,
        unit: item.unit || 'units',
        balanceAfter: balance.onHand,
        reason: `PO Receipt: ${po.poNumber}`,
        referenceType: 'purchase_order',
      });
    }

    // Determine new status
    const allFullyReceived = po.items.every((i) => i.receivedQty >= i.orderedQty);
    if (allFullyReceived) {
      po.status = 'received';
      po.completedAt = new Date();
    } else {
      po.status = 'partially_received';
    }

    await po.save();

    // Update supplier performance
    const supplier = await this.supplierModel.findById(po.supplierId);
    if (supplier) {
      const perf = supplier.performance || {
        totalOrdersCount: 0,
        onTimeDeliveryRate: 100,
        fulfillmentRate: 100,
        rating: 5.0,
      };

      perf.totalOrdersCount += 1;
      const isOntime = !po.expectedAt || new Date() <= po.expectedAt;
      perf.onTimeDeliveryRate = Math.round(
        (perf.onTimeDeliveryRate * (perf.totalOrdersCount - 1) + (isOntime ? 100 : 0)) / perf.totalOrdersCount,
      );

      const totalOrdered = po.items.reduce((acc, i) => acc + i.orderedQty, 0);
      const totalRecv = po.items.reduce((acc, i) => acc + i.receivedQty, 0);
      const orderFulfillment = totalOrdered > 0 ? Math.min(100, (totalRecv / totalOrdered) * 100) : 100;
      perf.fulfillmentRate = Math.round(
        (perf.fulfillmentRate * (perf.totalOrdersCount - 1) + orderFulfillment) / perf.totalOrdersCount,
      );

      supplier.performance = perf;
      await supplier.save();
    }

    // Broadcast inventory & PO updates
    this.eventsGateway.broadcastInventoryUpdate(tenantIdStr, {
      poNumber: po.poNumber,
      status: po.status,
      receipts: dto.receipts,
    });

    return {
      message: 'Stock received and inventory balance updated successfully',
      purchaseOrder: po,
    };
  }

  async cancelPO(tenantIdStr: string, poId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const po = await this.poModel.findOne({ _id: new Types.ObjectId(poId), tenantId });
    if (!po) {
      throw new NotFoundException(`Purchase order ${poId} not found`);
    }

    if (po.status === 'received') {
      throw new BadRequestException('Cannot cancel an already completed purchase order');
    }

    po.status = 'cancelled';
    await po.save();
    return po;
  }

  async listPOs(tenantIdStr: string, status?: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const filter: Record<string, unknown> = { tenantId };
    if (status) {
      filter.status = status;
    }
    return this.poModel
      .find(filter)
      .populate('supplierId', 'name contactPerson email leadTimeDays')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getPO(tenantIdStr: string, poId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const po = await this.poModel
      .findOne({ _id: new Types.ObjectId(poId), tenantId })
      .populate('supplierId', 'name contactPerson email phone address leadTimeDays performance')
      .lean();

    if (!po) {
      throw new NotFoundException(`Purchase order ${poId} not found`);
    }
    return po;
  }
}

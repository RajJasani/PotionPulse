import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { CatalogItemDto, CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
  ) {}

  async createSupplier(tenantIdStr: string, dto: CreateSupplierDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);

    const catalogItems = (dto.catalog || []).map((c) => ({
      ingredientId: new Types.ObjectId(c.ingredientId),
      supplierSku: c.supplierSku,
      unitCost: c.unitCost,
      leadTimeDays: c.leadTimeDays || dto.leadTimeDays || 3,
      moq: c.moq || 1,
      packSize: c.packSize || 1,
    }));

    return this.supplierModel.create({
      tenantId,
      name: dto.name,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      leadTimeDays: dto.leadTimeDays || 3,
      status: dto.status || 'active',
      catalog: catalogItems,
      notes: dto.notes,
      performance: {
        totalOrdersCount: 0,
        onTimeDeliveryRate: 100,
        fulfillmentRate: 100,
        rating: 5.0,
      },
    });
  }

  async listSuppliers(tenantIdStr: string, status?: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const filter: Record<string, unknown> = { tenantId };
    if (status) {
      filter.status = status;
    }
    return this.supplierModel.find(filter).sort({ name: 1 }).lean();
  }

  async getSupplier(tenantIdStr: string, supplierId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const supplier = await this.supplierModel
      .findOne({ _id: new Types.ObjectId(supplierId), tenantId })
      .lean();

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    return supplier;
  }

  async updateSupplier(tenantIdStr: string, supplierId: string, dto: UpdateSupplierDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const supplier = await this.supplierModel.findOne({
      _id: new Types.ObjectId(supplierId),
      tenantId,
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    if (dto.name !== undefined) supplier.name = dto.name;
    if (dto.contactPerson !== undefined) supplier.contactPerson = dto.contactPerson;
    if (dto.email !== undefined) supplier.email = dto.email;
    if (dto.phone !== undefined) supplier.phone = dto.phone;
    if (dto.address !== undefined) supplier.address = dto.address;
    if (dto.leadTimeDays !== undefined) supplier.leadTimeDays = dto.leadTimeDays;
    if (dto.status !== undefined) supplier.status = dto.status;
    if (dto.notes !== undefined) supplier.notes = dto.notes;

    if (dto.catalog !== undefined) {
      supplier.catalog = dto.catalog.map((c) => ({
        ingredientId: new Types.ObjectId(c.ingredientId),
        supplierSku: c.supplierSku,
        unitCost: c.unitCost,
        leadTimeDays: c.leadTimeDays,
        moq: c.moq,
        packSize: c.packSize,
      }));
    }

    await supplier.save();
    return supplier;
  }

  async addOrUpdateCatalogItem(tenantIdStr: string, supplierId: string, itemDto: CatalogItemDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const supplier = await this.supplierModel.findOne({
      _id: new Types.ObjectId(supplierId),
      tenantId,
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const ingId = new Types.ObjectId(itemDto.ingredientId);
    const ingredient = await this.ingredientModel.findOne({ _id: ingId, tenantId });
    if (!ingredient) {
      throw new BadRequestException(`Ingredient ${itemDto.ingredientId} does not exist`);
    }

    const existingIdx = supplier.catalog.findIndex(
      (c) => c.ingredientId.toString() === ingId.toString(),
    );

    const catalogItem = {
      ingredientId: ingId,
      supplierSku: itemDto.supplierSku,
      unitCost: itemDto.unitCost,
      leadTimeDays: itemDto.leadTimeDays,
      moq: itemDto.moq,
      packSize: itemDto.packSize,
    };

    if (existingIdx >= 0) {
      supplier.catalog[existingIdx] = catalogItem;
    } else {
      supplier.catalog.push(catalogItem);
    }

    await supplier.save();
    return supplier;
  }
}

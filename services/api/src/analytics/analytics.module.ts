import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemSchema } from '../sales/schemas/sale-item.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { StockMovement, StockMovementSchema } from '../movements/schemas/stock-movement.schema';
import { Supplier, SupplierSchema } from '../suppliers/schemas/supplier.schema';
import { PurchaseOrder, PurchaseOrderSchema } from '../purchase-orders/schemas/purchase-order.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: SaleItem.name, schema: SaleItemSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

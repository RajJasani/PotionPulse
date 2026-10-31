import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder, PurchaseOrderSchema } from './schemas/purchase-order.schema';
import { Supplier, SupplierSchema } from '../suppliers/schemas/supplier.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { StockMovement, StockMovementSchema } from '../movements/schemas/stock-movement.schema';
import { Location, LocationSchema } from '../inventory/schemas/location.schema';
import { ForecastsModule } from '../forecasts/forecasts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    ForecastsModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}

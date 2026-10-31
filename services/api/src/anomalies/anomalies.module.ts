import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnomaliesService } from './anomalies.service';
import { AnomaliesController } from './anomalies.controller';
import { Anomaly, AnomalySchema } from './schemas/anomaly.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { StockMovement, StockMovementSchema } from '../movements/schemas/stock-movement.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemSchema } from '../sales/schemas/sale-item.schema';
import { DemandEvent, DemandEventSchema } from '../events/schemas/demand-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Anomaly.name, schema: AnomalySchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: SaleItem.name, schema: SaleItemSchema },
      { name: DemandEvent.name, schema: DemandEventSchema },
    ]),
  ],
  controllers: [AnomaliesController],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}

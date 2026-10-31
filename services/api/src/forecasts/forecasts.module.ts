import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';
import { Forecast, ForecastSchema } from './schemas/forecast.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemSchema } from '../sales/schemas/sale-item.schema';
import { DemandEvent, DemandEventSchema } from '../events/schemas/demand-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Forecast.name, schema: ForecastSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: SaleItem.name, schema: SaleItemSchema },
      { name: DemandEvent.name, schema: DemandEventSchema },
    ]),
  ],
  controllers: [ForecastsController],
  providers: [ForecastsService],
  exports: [ForecastsService],
})
export class ForecastsModule {}

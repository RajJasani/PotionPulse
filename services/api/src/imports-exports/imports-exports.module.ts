import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportsExportsService } from './imports-exports.service';
import { ImportsExportsController } from './imports-exports.controller';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { StockMovement, StockMovementSchema } from '../movements/schemas/stock-movement.schema';
import { Location, LocationSchema } from '../inventory/schemas/location.schema';
import { ForecastsModule } from '../forecasts/forecasts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ingredient.name, schema: IngredientSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    ForecastsModule,
  ],
  controllers: [ImportsExportsController],
  providers: [ImportsExportsService],
  exports: [ImportsExportsService],
})
export class ImportsExportsModule {}

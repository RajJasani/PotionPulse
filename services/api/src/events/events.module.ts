import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { DemandEvent, DemandEventSchema } from './schemas/demand-event.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemSchema } from '../sales/schemas/sale-item.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DemandEvent.name, schema: DemandEventSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: SaleItem.name, schema: SaleItemSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsGateway, EventsService],
  exports: [EventsGateway, EventsService],
})
export class EventsModule {}

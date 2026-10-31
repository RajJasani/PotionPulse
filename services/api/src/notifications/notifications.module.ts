import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceSchema } from '../inventory/schemas/inventory-balance.schema';
import { DemandEvent, DemandEventSchema } from '../events/schemas/demand-event.schema';
import { ForecastsModule } from '../forecasts/forecasts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: DemandEvent.name, schema: DemandEventSchema },
    ]),
    ForecastsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

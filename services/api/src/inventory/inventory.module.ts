import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Location, LocationSchema } from './schemas/location.schema';
import { InventoryBalance, InventoryBalanceSchema } from './schemas/inventory-balance.schema';
import { StockMovement, StockMovementSchema } from '../movements/schemas/stock-movement.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { AuditLog, AuditLogSchema } from '../audit/schemas/audit-log.schema';
import { IdempotencyRecord, IdempotencyRecordSchema } from '../common/schemas/idempotency.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
      { name: InventoryBalance.name, schema: InventoryBalanceSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: IdempotencyRecord.name, schema: IdempotencyRecordSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService, MongooseModule],
})
export class InventoryModule {}

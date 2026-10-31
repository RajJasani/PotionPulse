import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { SaleItem, SaleItemSchema } from './schemas/sale-item.schema';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    InventoryModule,
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: SaleItem.name, schema: SaleItemSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Ingredient.name, schema: IngredientSchema },
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, MongooseModule],
})
export class SalesModule {}

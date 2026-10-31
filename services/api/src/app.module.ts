import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ForecastsModule } from './forecasts/forecasts.module';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    IngredientsModule,
    InventoryModule,
    SalesModule,
    AnalyticsModule,
    ForecastsModule,
    AnomaliesModule,
    EventsModule,
    HealthModule,
  ],
})
export class AppModule {}

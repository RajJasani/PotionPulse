import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const uri =
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/potionpulse';

        logger.log(`Connecting to MongoDB (target: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')})`);
        return {
          uri,
          autoIndex: true,
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import { ProductsModule } from './products/products.module';
import { PurchasesModule } from './purchases/purchases.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('databaseUrl'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<boolean>('dbSsl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    PurchasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

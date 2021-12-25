import { BotModule } from './bot/bot.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionsController } from './missions/missions.controller';
import { MongoModule } from 'nest-mongodb';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BotModule,
    MongoModule.forRoot(process.env.MONGO_HOST, 'prod'),
  ],
  controllers: [UsersController, MissionsController, AppController],
  providers: [AppService],
})
export class AppModule {}

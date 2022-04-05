import { BotModule } from './bot/bot.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionsController } from './missions/missions.controller';
import { MongoModule } from 'nest-mongodb';
import { DiscordModule } from '@discord-nestjs/core';
import { RestartTestServerCommand } from './bot/commands/restart-test-server.command';
import { Intents } from 'discord.js';
import { ApplicationCommandPermissionTypes } from 'discord.js/typings/enums';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('DISCORD_BOT_TOKEN'),
        registerCommandOptions: [
          {
            forGuild: configService.get('DISCORD_SERVER_ID'),
            removeCommandsBefore: true,
          },
        ],
        slashCommandsPermissions: [
          {
            commandClassType: RestartTestServerCommand,
            permissions: [
              {
                id: configService.get('DISCORD_MISSION_MAKER_ID'),
                type: ApplicationCommandPermissionTypes.ROLE,
                permission: true,
              },
            ],
          },
        ],
        discordClientOptions: {
          intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MEMBERS,
          ],
        },
      }),
      inject: [ConfigService],
    }),
    BotModule,
    MongoModule.forRoot(process.env.MONGO_HOST, 'prod'),
  ],
  controllers: [UsersController, MissionsController, AppController],
  providers: [AppService],
})
export class AppModule {}

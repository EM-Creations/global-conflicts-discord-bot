import { BotGateway } from './bot.gateway';
import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';

import { RestartTestServerCommand } from './commands/restart-test-server.command';
import { StopTestServerCommand } from './commands/stop-test-server.command';
@Module({
  imports: [DiscordModule.forFeature()],
  exports: [DiscordModule],
  providers: [BotGateway, RestartTestServerCommand, StopTestServerCommand],
})
export class BotModule {}

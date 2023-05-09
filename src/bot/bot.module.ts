import { BotGateway } from './bot.gateway';
import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';

import { RestartTestServerCommand } from './commands/restart/restart-test-server.command';
import { StopTestServerCommand } from './commands/stop/stop-test-server.command';
import { FantasyTestServerSubCommand } from './commands/subcommands/fantasy-modpack.subcommand';
import { MainTestServerSubCommand } from './commands/subcommands/main-modpack.subcommand';
import { WW2TestServerSubCommand } from './commands/subcommands/ww2-modpack.subcomand';
import { CrossCommunityTestServerSubCommand } from './commands/subcommands/crosscommunity-modpack.subcommand';

@Module({
  imports: [DiscordModule.forFeature()],
  exports: [DiscordModule],
  providers: [BotGateway, RestartTestServerCommand, StopTestServerCommand, FantasyTestServerSubCommand, MainTestServerSubCommand, WW2TestServerSubCommand, CrossCommunityTestServerSubCommand],
})
export class BotModule { }

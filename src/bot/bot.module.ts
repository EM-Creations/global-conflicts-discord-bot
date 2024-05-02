import { BotGateway } from './bot.gateway';
import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';

import { TestServersCommands } from './commands/server/testservers.command';
import { FantasyTestServerSubCommand } from './commands/subcommands/fantasy-modpack.subcommand';
import { MainTestServerSubCommand, MainServerSubCommand } from './commands/subcommands/main-modpack.subcommand';
import { WW2TestServerSubCommand } from './commands/subcommands/ww2-modpack.subcomand';
import { CrossCommunityTestServerSubCommand } from './commands/subcommands/crosscommunity-modpack.subcommand';
import { ModRouletteTestServerSubCommand } from './commands/subcommands/mod-roulette-modpack.subcommand';

@Module({
  imports: [DiscordModule.forFeature()],
  exports: [DiscordModule],
  providers: [BotGateway, TestServersCommands, FantasyTestServerSubCommand, MainTestServerSubCommand, MainServerSubCommand, WW2TestServerSubCommand, CrossCommunityTestServerSubCommand, ModRouletteTestServerSubCommand],
})
export class BotModule { }

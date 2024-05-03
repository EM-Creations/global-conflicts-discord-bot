import { BotGateway } from './bot.gateway';
import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';

import { TestServersCommands } from './commands/server/testservers.command';
import { FantasyTestServerSubCommand } from './commands/subcommands/fantasy-modpack.subcommand';
import { MainTestServerSubCommand } from './commands/subcommands/main-modpack.subcommand';
import { MainServerSubCommand } from './commands/subcommands/main.subcommand';
import { WW2TestServerSubCommand } from './commands/subcommands/ww2-modpack.subcomand';
import { CrossCommunityTestServerSubCommand } from './commands/subcommands/crosscommunity-modpack.subcommand';
import { ModRouletteTestServerSubCommand } from './commands/subcommands/mod-roulette-modpack.subcommand';
import { ReforgerServerSubCommand } from './commands/subcommands/reforger.subcommand';

@Module({
  imports: [DiscordModule.forFeature()],
  exports: [DiscordModule],
  providers: [
    BotGateway, 
    TestServersCommands, 
    MainServerSubCommand,
    FantasyTestServerSubCommand, 
    MainTestServerSubCommand, 
    WW2TestServerSubCommand, 
    CrossCommunityTestServerSubCommand, 
    ModRouletteTestServerSubCommand,
    ReforgerServerSubCommand
],
})
export class BotModule { }

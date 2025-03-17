import { BotGateway } from './bot.gateway';
import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TestServersCommands } from './commands/server/testservers.command';
import { FantasyTestServerSubCommand } from './commands/subcommands/fantasy-modpack.subcommand';
import { MainTestServerSubCommand } from './commands/subcommands/main-modpack.subcommand';
import { MainServerSubCommand } from './commands/subcommands/main.subcommand';
import { WW2TestServerSubCommand } from './commands/subcommands/ww2-modpack.subcomand';
import { CrossCommunityTestServerSubCommand } from './commands/subcommands/crosscommunity-modpack.subcommand';
import { ModRouletteTestServerSubCommand } from './commands/subcommands/mod-roulette-modpack.subcommand';
import { StartTimeCommand } from './commands/subcommands/starttime.command';
import { ReforgerServerSubCommand } from './commands/subcommands/reforger.subcommand';
import { SwearJarModule } from '../swear-jar/swear-jar.module';
import { VoiceRolesModule } from '../voice-roles/voice-roles.module';
import { PonyBotListener } from '../PonyBot/PonyBot.listener';


@Module({
  imports: [
    DiscordModule.forFeature(),
    ScheduleModule.forRoot(),
    SwearJarModule,
    VoiceRolesModule,
  ],
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
    ReforgerServerSubCommand,
    StartTimeCommand,
    PonyBotListener,
],
})
export class BotModule { }

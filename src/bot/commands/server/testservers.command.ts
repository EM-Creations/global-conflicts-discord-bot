
import {
  Command,
  DiscordClientProvider,
  EventParams,
  Handler,
  UseGroup
} from '@discord-nestjs/core';
import {
  ClientEvents
} from 'discord.js';

import { FantasyTestServerSubCommand } from '../subcommands/fantasy-modpack.subcommand';
import { MainTestServerSubCommand } from '../subcommands/main-modpack.subcommand';
import { MainServerSubCommand } from '../subcommands/main.subcommand';
import { WW2TestServerSubCommand } from '../subcommands/ww2-modpack.subcomand';
import { CrossCommunityTestServerSubCommand } from '../subcommands/crosscommunity-modpack.subcommand';
import { ModRouletteTestServerSubCommand } from '../subcommands/mod-roulette-modpack.subcommand';

@Command({
  name: 'server',
  description: "Restarts a test server. Starts if it's offline.",
  include: [
    UseGroup(
      { name: 'restart', description: 'The server you want to interact with.' },
      MainServerSubCommand,
      MainTestServerSubCommand,
      WW2TestServerSubCommand,
      FantasyTestServerSubCommand,
      CrossCommunityTestServerSubCommand,
      ModRouletteTestServerSubCommand
    ),
    UseGroup(
      { name: 'stop', description: 'The server you want to interact with.' },
      MainTestServerSubCommand,
      MainServerSubCommand,
      WW2TestServerSubCommand,
      FantasyTestServerSubCommand,
      CrossCommunityTestServerSubCommand,
      ModRouletteTestServerSubCommand
    ),
    UseGroup(
      { name: 'update_mods', description: 'Triggers Swifty update process. Can take a while.' },
      ModRouletteTestServerSubCommand
    )
  ]
})

export class TestServersCommands {
  constructor(private readonly discordProvider: DiscordClientProvider) { }
  @Handler()
  onPlayCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
  ): string {
    return 'Please choose a server.';
  }
}







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
import { WW2TestServerSubCommand } from '../subcommands/ww2-modpack.subcomand';
import { CrossCommunityTestServerSubCommand } from '../subcommands/crosscommunity-modpack.subcommand';

@Command({
  name: 'server',
  description: "Stops a test server. Starts if it's offline.",
  include: [
    UseGroup(
      { name: 'stop', description: 'The server you want to interact with.' },
      MainTestServerSubCommand,
      WW2TestServerSubCommand,
      FantasyTestServerSubCommand,
      CrossCommunityTestServerSubCommand
    )
  ]
})

export class StopTestServerCommand {
  constructor(private readonly discordProvider: DiscordClientProvider) { }
  @Handler()
  onPlayCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
  ): string {
    return 'Please choose a server.';
  }
}




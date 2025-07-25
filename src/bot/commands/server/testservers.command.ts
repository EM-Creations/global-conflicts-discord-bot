
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

import { MainServerSubCommand } from '../subcommands/main.subcommand';
import { ConflictServerSubCommand } from '../subcommands/conflict.subcommand';

@Command({
  name: 'server',
  description: "Restarts a server. Starts if it's offline.",
  include: [
    UseGroup(
      { name: 'restart', description: 'The server you want to interact with.' },
      MainServerSubCommand,
      ConflictServerSubCommand
    ),
    UseGroup(
      { name: 'stop', description: 'The server you want to interact with.' },
      MainServerSubCommand,
      ConflictServerSubCommand
    ),
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




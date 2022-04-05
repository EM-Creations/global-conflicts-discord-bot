import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordClientProvider,
  DiscordTransformedCommand,
  UsePipes,
} from '@discord-nestjs/core';
import {
  CommandInteraction,
  GuildMemberRoleManager,
  TextChannel,
} from 'discord.js';

import { spawn } from 'child_process';

@Command({
  name: 'tests',
  description:
    'Stops the test server. Use this if you need to remove missions from it.',
})
@UsePipes(TransformPipe)
export class StopTestServerCommand implements DiscordTransformedCommand<any> {
  constructor(private readonly discordProvider: DiscordClientProvider) {}

  async handler(interaction: CommandInteraction) {
    const userRoleManager: GuildMemberRoleManager = interaction.member
      .roles as GuildMemberRoleManager;

    const isAdmin = userRoleManager.cache.some(
      (role) => role.id === process.env.DISCORD_ADMIN_ROLE_ID,
    );

    const isMissionMaker = userRoleManager.cache.some(
      (role) => role.id === process.env.DISCORD_MISSION_MAKER_ID,
    );
    const isMissionReviewer = userRoleManager.cache.some(
      (role) => role.id === process.env.DISCORD_MISSION_REVIEW_TEAM_ROLE_ID,
    );

    if (!isMissionMaker && !isMissionReviewer && !isAdmin) {
      return 'You do not have permission to use this command!';
    }

    const discordClient = this.discordProvider.getClient();
    const adminChannel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_ADMIN_CHANNEL,
    ) as TextChannel;

    const child = spawn('powershell.exe', ['c:\\ArmAServers\\StopTest.ps1']);
    child.stdout.on('data', async function (data) {
      try {
        const text = '' + data;
        if (text.includes('->')) {
          await interaction.channel.send(text.replace('->', ''));
        }
      } catch (e) {
        console.log(e);
      }
    });

    child.stderr.on('data', async function (data) {
      await interaction.channel.send('An error happened!');
      try {
        const text = '' + data;
        await interaction.channel.send('An error happened!');
        if (text.includes('->')) {
          await interaction.channel.send(text.replace('->', ''));
        }
        await adminChannel.send(text);
      } catch (e) {
        console.log(e);
      }
    });

    child.stdin.end();
    return 'Stopping Test server...';
  }
}

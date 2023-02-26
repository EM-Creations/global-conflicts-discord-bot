
import {
  Command,
  DiscordClientProvider,
  EventParams,
  Handler,
  InteractionEvent,

} from '@discord-nestjs/core';
import {
  ClientEvents,
  CommandInteraction,
  GuildMemberRoleManager,
  TextChannel,
} from 'discord.js';

import { spawn } from 'child_process';
 
@Command({
  name: 'testr',
  description: "Restarts the test server. Starts if it's offline.",
})



export class RestartTestServerCommand {

  constructor(private readonly discordProvider: DiscordClientProvider) {}

  @Handler()
  onPlayCommand(
    @EventParams() args: ClientEvents['interactionCreate'],
  ): string {


    const member = args[0].member;
    const channel = args[0].channel;


    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
    const userRoleManager: GuildMemberRoleManager = member
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

    if (isWeekend) {
      return 'This command only works on weekdays.';
    }
    const discordClient = this.discordProvider.getClient();
    const adminChannel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_ADMIN_CHANNEL,
    ) as TextChannel;

    const child = spawn('powershell.exe', [
      'c:\\ArmAServers\\TrackHeadlessTest.ps1',
    ]);
    child.stdout.on('data', async function (data) {
      try {
        const text = '' + data;
        if (text.includes('->')) {
          await channel.send(text.replace('->', ''));
        }
      } catch (e) {
        console.log(e);
      }
    });

    child.stderr.on('data', async function (data) {
      try {
        const text = '' + data;
        if (text.includes('->')) {
          await channel.send(text.replace('->', ''));
        }
        await channel.send('An error happened!');
        await adminChannel.send('' + data);
      } catch (e) {
        console.log(e);
      }
    });

    child.stdin.end();
    return 'Restarting/Starting Test server...';


  }
}




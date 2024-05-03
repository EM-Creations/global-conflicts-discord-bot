import { SlashCommandPipe } from "@discord-nestjs/common";
import { DiscordClientProvider, EventParams, Handler, IA, SubCommand } from "@discord-nestjs/core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ChatInputCommandInteraction, ClientEvents, GuildMemberRoleManager, TextChannel } from "discord.js";
import { permissionCheckMain } from "src/helpers/restart_stop_command_perms_check";

@SubCommand({ name: 'main', description: 'Starts/Restarts the main server. This is the regular server for sessions.', })
export class MainServerSubCommand {
    constructor(private readonly discordProvider: DiscordClientProvider) { }

    @Handler()
    onServerSelectCommand(
        @EventParams() args: ClientEvents['interactionCreate']): string {
        const member = args[0].member;
        const channel = args[0].channel as TextChannel;

        let action = "restart";
        if (args[0] instanceof ChatInputCommandInteraction) {
            action = args[0].options["_group"];
        }
        const permCheck = permissionCheckMain(member)

        if (permCheck != true) {
            return permCheck
        }

        const discordClient = this.discordProvider.getClient();
        const adminChannel: TextChannel = discordClient.channels.cache.get(
            process.env.DISCORD_BOT_ADMIN_CHANNEL,
        ) as TextChannel;
        let child: ChildProcessWithoutNullStreams;
        if (action == "restart") {
            channel.send(member?.user?.username + ' restarted main server');
            child = spawn('powershell.exe', [
                `${process.env.MAIN_SERVER_START_SCRIPT_PATH}\\start.ps1`,
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

        } else {
            channel.send(member?.user?.username + ' stopped main server');
            child = spawn('powershell.exe', [`${process.env.MAIN_SERVER_START_SCRIPT_PATH}\\stop.ps1`,]);
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
        }
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
    }
}
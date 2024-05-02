import { SlashCommandPipe } from "@discord-nestjs/common";
import { DiscordClientProvider, EventParams, Handler, IA, SubCommand } from "@discord-nestjs/core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ChatInputCommandInteraction, ClientEvents, GuildMemberRoleManager, TextChannel } from "discord.js";
import permissionCheck from "src/helpers/restart_stop_command_perms_check";

@SubCommand({ name: 'test', description: 'Starts/Restarts the test server. This is the test regular server for regular missions.', })
export class MainTestServerSubCommand {
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
        const permCheck = permissionCheck(member, action)

        if (permCheck != true) {
            return permCheck
        }

        const discordClient = this.discordProvider.getClient();
        const adminChannel: TextChannel = discordClient.channels.cache.get(
            process.env.DISCORD_BOT_ADMIN_CHANNEL,
        ) as TextChannel;
        let child: ChildProcessWithoutNullStreams;
        if (action == "restart") {
            child = spawn('powershell.exe', [
                `${process.env.MAIN_TEST_SERVER_START_SCRIPT_PATH}\\start.ps1`,
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
            child = spawn('powershell.exe', [`${process.env.MAIN_TEST_SERVER_START_SCRIPT_PATH}\\stop.ps1`,]);
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
import { SlashCommandPipe } from "@discord-nestjs/common";
import { DiscordClientProvider, EventParams, Handler, IA, SubCommand } from "@discord-nestjs/core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ChatInputCommandInteraction, ClientEvents, GuildMemberRoleManager, TextChannel } from "discord.js";
import permissionCheck from "src/helpers/restart_stop_command_perms_check";
@SubCommand({ name: 'mod_roulette_test', description: 'Starts/Restarts the mod roulette test server.', })
export class ModRouletteTestServerSubCommand {
    constructor(private readonly discordProvider: DiscordClientProvider) { }

    @Handler()
    onServerSelectCommand(
        @EventParams() args: ClientEvents['interactionCreate']): string {
        const member = args[0].member;
        const channel = args[0].channel as TextChannel;

        const userRoleManager: GuildMemberRoleManager = member
            .roles as GuildMemberRoleManager;

        const permCheck = userRoleManager.cache.some(
            (role) => role.id === process.env.DISCORD_ADMIN_ROLE_ID ||
                role.id === process.env.DISCORD_MOD_ROULETTE_OPERATOR_ROLE_ID ||
                role.id === process.env.DISCORD_MISSION_REVIEW_TEAM_ROLE_ID
        );


        if (permCheck != true) {
            return "You don't have permission to use this command."
        }

        const discordClient = this.discordProvider.getClient();
        const adminChannel: TextChannel = discordClient.channels.cache.get(
            process.env.DISCORD_BOT_ADMIN_CHANNEL,
        ) as TextChannel;
        let action = "restart";
        if (args[0] instanceof ChatInputCommandInteraction) {
            action = args[0].options["_group"];
        }
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

        } else if (action == "stop") {
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
        else if (action == "update_mods") {
            var exec = require('child_process').exec;
            child = exec("D:\\ArmAServers\\scripts\\mod_roulette\\swifty-cli.exe create D:\\ArmAServers\\modrouletteOperator\\repo.json D:\\ArmAServers\\mod-roulette-mods",
                async function (error, stdout, stderr) {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    const text = stderr || stdout;
                    //   await channel.send(text.replace('->', ''))
                    if (text) {
                        await channel.send(stderr || stdout);
                    }

                });

        }

 

        child.stdin.end();
    }
}
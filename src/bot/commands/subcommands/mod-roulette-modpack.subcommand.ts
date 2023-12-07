import { SlashCommandPipe } from "@discord-nestjs/common";
import { DiscordClientProvider, EventParams, Handler, IA, SubCommand } from "@discord-nestjs/core";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { ChatInputCommandInteraction, ClientEvents, GuildMemberRoleManager, TextChannel, AttachmentBuilder } from "discord.js";
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
            child.stdin.end();
            return "Restarting server...";

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
            child.stdin.end();
            return "Stopping server...";
        }
        else if (action == "update_mods") {
            let fullLog = ""
            var exec = require('child_process').exec;

            child = exec(process.env.MOD_ROULETTE_SWIFTY_COMMAND,
                function (error, stdout, stderr) {
                    const text = stderr || stdout;
                    if (text) {
                        fullLog = fullLog + text
                    }
                });
            child.on('close', (code) => {
                let buffer = Buffer.from(fullLog);
                const attachment = new AttachmentBuilder(buffer, { name: 'swifty-log.txt' })
                channel.send({ content: "Swifty update finished", files: [attachment] });
                child.stdin.end();
            });
            return "Swifty update started, please wait.";

        }




    }
}
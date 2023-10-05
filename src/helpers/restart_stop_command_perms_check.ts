import { GuildMemberRoleManager } from "discord.js";

export default function permissionCheck(member) {

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
    return true;
}
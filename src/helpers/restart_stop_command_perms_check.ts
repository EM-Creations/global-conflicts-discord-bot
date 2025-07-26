import { GuildMemberRoleManager } from "discord.js";

export default function permissionCheck(member) {

    //const date = new Date();
    //const dayOfWeek = date.getDay();
    //const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
    const userRoleManager: GuildMemberRoleManager = member
        .roles as GuildMemberRoleManager;

    const isAdmin = userRoleManager.cache.some(
        (role) => role.id === process.env.DISCORD_ADMIN_ROLE_ID,
    );

    const isReforgerGM = userRoleManager.cache.some(
        (role) => role.id === process.env.DISCORD_REFORGERGM_ROLE_ID,
    );

    if (!isReforgerGM && !isAdmin) {
        return 'You do not have permission to use this command!';
    }

    //if (isWeekend) {
    //    const dayHour = date.getHours();
    //    if (dayHour <= 10 || dayHour >= 17) {
    //        return true
    //    } else {
    //        return 'This command cannot be ran while a main session is running/getting started';
    //    }
    //}
    return true;
}

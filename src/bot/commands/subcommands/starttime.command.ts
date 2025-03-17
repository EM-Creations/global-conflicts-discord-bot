import { Command, Handler } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';

@Injectable()
@Command({
  name: 'starttime',
  description: 'Displays the next session start time in your local timezone',
})
export class StartTimeCommand {
  @Handler()
  async onStartTimeCommand(interaction: CommandInteraction): Promise<void> {
    const now = new Date(); // Current UTC time
    const year = now.getUTCFullYear();

    // Calculate DST start (last Sunday of March at 01:00 UTC)
    const dstStart = this.getLastSundayOfMonth(year, 2); // March (0-based: 2)
    dstStart.setUTCHours(1, 0, 0, 0);

    // Calculate DST end (last Sunday of October at 01:00 UTC)
    const dstEnd = this.getLastSundayOfMonth(year, 9); // October (0-based: 9)
    dstEnd.setUTCHours(1, 0, 0, 0);

    // Check if we're in DST
    const isDst = now >= dstStart && now < dstEnd;

    // Find the next Saturday or Sunday
    const nextSessionDate = this.getNextWeekendDay(now);
    nextSessionDate.setUTCHours(isDst ? 19 : 20, 0, 0, 0); // 19:00 UTC if DST, 20:00 UTC if not

    const unixTimestamp = Math.floor(nextSessionDate.getTime() / 1000);
    const response = `The Reforger session starts at <t:${unixTimestamp}:t>, every Saturday and Sunday!`;
    await interaction.reply(response);
  }

  // Helper function to get the last Sunday of a given month
  private getLastSundayOfMonth(year: number, month: number): Date {
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const dayOfWeek = lastDay.getUTCDay(); // 0 = Sunday, 6 = Saturday
    lastDay.setUTCDate(lastDay.getUTCDate() - dayOfWeek);
    return lastDay;
  }

  // Helper function to get the next Saturday or Sunday
  private getNextWeekendDay(date: Date): Date {
    const result = new Date(date);
    const currentDay = result.getUTCDay(); // 0 = Sunday, 6 = Saturday

    // Days to next Saturday (6) or Sunday (0)
    const daysToSaturday = (6 - currentDay + 7) % 7 || 7; // Distance to Saturday
    const daysToSunday = (0 - currentDay + 7) % 7 || 7; // Distance to Sunday

    // Choose the closer day
    const daysToAdd = Math.min(daysToSaturday, daysToSunday);
    result.setUTCDate(result.getUTCDate() + daysToAdd);

    return result;
  }
}
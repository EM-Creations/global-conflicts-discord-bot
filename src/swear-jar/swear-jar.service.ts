import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscordClientProvider, Once, On } from '@discord-nestjs/core';
import { TextChannel } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class SwearJarService implements OnModuleInit {
  private swearJarCount = 0;
  private readonly SWEAR_JAR_FILE_PATH = path.join(process.cwd(), 'swearJar.json');
  private readonly TRIGGER_TERMS = ['uo', 'united operations', '1.3'];

  constructor(private readonly discordProvider: DiscordClientProvider) {}

  async onModuleInit() {
    await this.loadSwearJarData();
  }

  @Once('ready')
  onReady() {
    console.log('Swear Jar service is ready!');
  }

  @On('messageCreate')
  async onMessage(message: any) {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const channel = message.channel;

    // Split into words for single-word checks
    const words = content.split(/\s+/).filter(word => word.length > 0);

    // Check for trigger terms: exact word match for single words, full phrase match for multi-word terms
    const termFound = this.TRIGGER_TERMS.some(term => {
      if (term.includes(' ')) {
        // For multi-word terms, check the full content
        return content.includes(term);
      } else {
        // For single-word terms, check the word list
        return words.includes(term);
      }
    });

    if (termFound) {
      this.swearJarCount += 1;
      console.log(`Swear Jar updated: ${this.swearJarCount} GC Bucks`);

      if (channel instanceof TextChannel) {
        await channel.send(`A GC Buck has been withdrawn from your account and put into the swear jar. Total: ${this.swearJarCount} GC Bucks`);
      } else {
        console.log(`Could not update Swear Jar for message - not a text channel`);
      }

      await this.saveSwearJarData();
    }
  }

  private async loadSwearJarData() {
    try {
      const data = await fs.readFile(this.SWEAR_JAR_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      this.swearJarCount = parsed.count || 0;
      console.log(`Swear Jar data loaded: ${this.swearJarCount} GC Bucks`);
    } catch (error) {
      console.log('No existing Swear Jar data found, starting fresh.');
      this.swearJarCount = 0;
    }
  }

  private async saveSwearJarData() {
    try {
      await fs.writeFile(this.SWEAR_JAR_FILE_PATH, JSON.stringify({ count: this.swearJarCount }, null, 2), 'utf-8');
      console.log('Swear Jar data saved to file.');
    } catch (error) {
      console.error('Error saving Swear Jar data:', error);
    }
  }

  public getSwearJarCount(): number {
    return this.swearJarCount;
  }
}
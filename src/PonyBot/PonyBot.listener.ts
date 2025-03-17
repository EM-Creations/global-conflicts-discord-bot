import { Injectable } from '@nestjs/common';
import { On } from '@discord-nestjs/core';
import { Message } from 'discord.js';

interface TriggerMap {
  [key: string]: string[];
}

interface CooldownMap {
  [trigger: string]: number; // Timestamp in milliseconds when cooldown expires
}

@Injectable()
export class PonyBotListener {
  private readonly TRIGGERS: TriggerMap = {
    jimbo: ['https://i.imgur.com/AjuYyoG.jpeg'],
    horse: [
      'https://cdn.discordapp.com/attachments/1231830545659330611/1272909101894205564/Horse_Gallery.gif?ex=67caf3fb&is=67c9a27b&hm=4f302d90a79d1f0eb1ee7c73b73425a7b4b2cec5e559fa0f90e325de4da65e76&',
      'https://tenor.com/view/horse-funny-horse-animal-funny-animal-side-eye-gif-9535896465412968428',
      'https://tenor.com/view/horse-derp-tongue-lick-beffen-gif-16516227',
      'https://cdn.discordapp.com/attachments/1231830545659330611/1272909101894205564/Horse_Gallery.gif?ex=67caf3fb&is=67c9a27b&hm=4f302d90a79d1f0eb1ee7c73b73425a7b4b2cec5e559fa0f90e325de4da65e76&',
      'https://cdn.discordapp.com/attachments/721821486599503937/1309797609627582535/Horse.gif?ex=67cb56d4&is=67ca0554&hm=1673bd4e5a6f5d2c0a423db89e6ef738a68fac1eef88969c3c35addd4ff67540&',
      'https://cdn.discordapp.com/attachments/702573941239316552/1299002506185277602/3fc0d2912c.gif?ex=67caf55b&is=67c9a3db&hm=7fbf6766d20af4d9edd2f6f529e0dfa8fb395ebe6a2cca36cead9fb3e8229d29&',
      'https://tenor.com/view/uma-musume-special-week-gif-5390447690494704388',
    ],
    vance: [
      'https://i.imgur.com/rLMKsp4.jpeg',
      'https://i.imgur.com/MrqqjsR.jpeg',
      'https://i.imgur.com/1Errlrj.png',
      'https://i.imgur.com/Io89S28.png',
      'https://i.imgur.com/jEyBbWW.jpeg',
    ],
    chinook: [
      'https://i.imgur.com/p22MVBT.png',
      'https://i.imgur.com/FGsqAXt.png',
      'https://i.imgur.com/c3h0eS7.png',
      'https://i.imgur.com/9Ltz8Dl.png',
      'https://i.imgur.com/afXlxMj.png',
      'https://i.imgur.com/oAJsoEV.png',
      'https://i.imgur.com/hWxRpH6.png',
    ],
    janny: [
      'https://i.imgur.com/AWoEZLO.png',
      'https://i.imgur.com/KOJzxz8.gif',
      'https://i.imgur.com/4PF1gIm.gif',
      'https://i.imgur.com/cl6sYDt.mp4',
      'https://i.imgur.com/igvqHid.mp4',
      'https://i.imgur.com/nJux8gD.mp4',
      'https://i.imgur.com/w0tCI5G.mp4',
      'https://i.imgur.com/umDDNtD.mp4',
      'https://i.imgur.com/sDRCWjX.mp4',
    ],
    congrats: ['https://i.imgur.com/o3KwHTO.jpg'],
    classic: ['https://i.imgur.com/cuOo6gN.gif'],
    wade: [
      'https://i.imgur.com/0Pj3Rw1.png',
      'https://i.imgur.com/9LnaSmK.png',
      'https://i.imgur.com/l60XKF1.png',
      'https://i.imgur.com/yqWXgPQ.png',
      'https://i.imgur.com/dlreCHf.png',
    ],
    gorilla: [
      'https://tenor.com/view/chief-keef-gorilla-chief-keef-im-a-gorilla-gif-26151372?quality=lossless',
      'https://tenor.com/view/macaquinho-gif-17267953830504704456?quality=lossless',
      'https://tenor.com/view/gorilla-goril-fight-league-of-legends-holy-trinity-gif-2093131343378708741?quality=lossless',
      'https://tenor.com/view/gorilla-feylowe-gif-16404137092311891672?quality=lossless',
    ],
  };

  private readonly COOLDOWN_DURATION = 120 * 1000; // 120 seconds in milliseconds
  private readonly EXCLUDED_CHANNEL_IDS = [
    '1345421564568404052', // Channel IDs where the bot wont trigger
    '1345421588283260998', 
  ];
  private cooldowns: CooldownMap = {};

  @On('messageCreate')
  async onMessage(message: Message): Promise<void> {
    if (message.author.bot) return;

    // Check if the message is in an excluded channel
    if (this.EXCLUDED_CHANNEL_IDS.includes(message.channel.id)) return;

    const content = message.content.toLowerCase();
    for (const trigger in this.TRIGGERS) {
      if (content.includes(trigger)) {
        const now = Date.now(); // Current time in milliseconds

        // Check global cooldown for this trigger
        const triggerCooldown = this.cooldowns[trigger];
        if (triggerCooldown && now < triggerCooldown) {
          const timeLeft = Math.ceil((triggerCooldown - now) / 1000); // Seconds remaining
          await message.channel.send(`${trigger} is on cooldown! ${timeLeft} seconds remaining.`);
          return;
        }

        // Send random image and set global cooldown
        const imageUrl = this.randomChoice(this.TRIGGERS[trigger]);
        await message.channel.send(imageUrl);
        this.cooldowns[trigger] = now + this.COOLDOWN_DURATION;
        return;
      }
    }
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
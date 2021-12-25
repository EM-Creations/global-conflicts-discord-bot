import { DiscordClientProvider, On, Once } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';

import { Interaction } from 'discord.js';
import * as mongo from 'mongodb';
import { InjectDb } from 'nest-mongodb';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(
    private readonly discordProvider: DiscordClientProvider,
    @InjectDb() private readonly db: mongo.Db,
  ) {}

  @Once('ready')
  onReady(): void {
    console.log('aaa');
    this.logger.log(
      `Logged din as ${this.discordProvider.getClient().user.tag}!`,
    );
  }

  @On('interactionCreate')
  async onInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const uniqueName = interaction.customId;
    const clicker = interaction.user;
    //  this.db.collection("users")

    const voteCountResult = await this.db.collection('missions').count({
      votes: clicker.id,
    });

    if (voteCountResult >= 4) {
      try {
        await interaction.reply({
          content: 'You already voted for 4 different missions.',
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
      } finally {
        return;
      }
    }
    const updateResult = await this.db.collection('missions').updateOne(
      { uniqueName: uniqueName },
      {
        $addToSet: {
          votes: clicker.id,
        },
      },
    );
    try {
      if (updateResult.modifiedCount === 1) {
        await interaction.reply({
          content: 'Vote submitted!',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'You already voted for this mission.',
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      return;
    }
  }
}

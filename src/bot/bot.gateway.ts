import { DiscordClientProvider, On, Once } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';

import { ActionRowBuilder, ActivityType, EmbedBuilder, Interaction, StringSelectMenuBuilder, TextChannel } from 'discord.js';
import { Player, QueryResult } from 'gamedig';
import * as mongo from 'mongodb';
import { InjectDb } from 'nest-mongodb';
import { COLOR_ERROR, COLOR_MAINTENANCE, COLOR_OK } from '../helpers/colors';
import locale from '../helpers/en';
import Server from '../helpers/server';
import Time from '../helpers/time';
import Settings from '../polling/teamspeak/settings';
import MayPostTeamspeakViewer from '../polling/teamspeak/teamspeak';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private maintenanceMode: boolean;
  private server = new Server(process.env.IP, parseInt(process.env.PORT));
  private refreshFails = 0;
  private maxRefreshFails = parseInt(process.env.MAXIMUM_REFRESH_FAILURES);
  constructor(
    private readonly discordProvider: DiscordClientProvider,
    @InjectDb() private readonly db: mongo.Db,
  ) { }

  @Once('ready')
  onReady(): void {
    this.logger.log(
      `Loggedd in as ${this.discordProvider.getClient().user.tag}!`,
    );

    this.startPolling();
    this.loopPolling();
    console.info('Bot is running');
  }

  @On('interactionCreate')
  async onInteraction(interaction: Interaction): Promise<void> {
    if (interaction.channelId == process.env.DISCORD_VOTING_CHANNEL) {
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
    if (interaction.channelId == process.env.DISCORD_BOT_AAR_CHANNEL) {
      if (interaction.isButton() && interaction.customId) {
        const uniqueName = interaction.customId;
        const clicker = interaction.user;


        const missionFound = await this.db.collection('missions').findOne({
          uniqueName: uniqueName
        })
        if (missionFound.authorID == clicker.id) {
          await interaction.reply({
            content: 'You can\'t rate your own mission. 🤓',
            ephemeral: true,
          });
          return;
        }
        if(!missionFound.history){
          await interaction.reply({
            content: 'You can\'t rate a mission that hasn\'t been played yet.',
            ephemeral: true,
          });
          return;
        }

       



        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(uniqueName)
              .setPlaceholder('Rate this mission:')
              .addOptions(
                {
                  label: 'Good',
                  description: 'The mission is well made and interesting.',
                  emoji: "👍",
                  value: 'positive',
                },
                {
                  label: 'It\'s alright',
                  description: 'Just a regular enjoyable mission.',
                  emoji: "🆗",
                  value: 'neutral',
                },
                {
                  label: 'Bad',
                  description: 'The mission has concept issues.',
                  emoji: "👎",
                  value: 'negative',
                },
              ),
          );

        await interaction.reply({
          content: 'Submit your rating:',
          ephemeral: true,
          components: [row]
        })

      }
      if (interaction.isAnySelectMenu()) {
        await interaction.deferUpdate();
        const uniqueName = interaction.customId;
        const clicker = interaction.user;

        const value = interaction["values"][0]
        const rating = {
          date: new Date(),
          ratingAuthorId: clicker.id,
          value: value,
        };
        const hasRating = await this.db.collection('missions').findOne(
          {
            uniqueName: uniqueName,
            "ratings.ratingAuthorId": clicker.id
          }
        );

        if (hasRating) {
          await this.db.collection("missions").updateOne(
            {
              uniqueName: uniqueName,
              "ratings.ratingAuthorId": clicker.id
            }, {
            $set: {
              "ratings.$.value": value,
              "ratings.$.date": new Date(),
            }
          }
          );
        } else {
          await this.db.collection('missions').updateOne(
            {
              uniqueName: uniqueName
            }, {
            $addToSet: { ratings: rating }
          }
          );
        }

        if (value == "negative") {
          await interaction.editReply({ content: "Rating submited! 📝 If you didn't enjoy this mission, consider writing a constructive review for the mission maker.", components: [] })
        } else {
          await interaction.editReply({
            content: 'Thanks for your input!',
            components: []

          });

        };
      }

    }


  }

  async startPolling(forceNewMessage = false) {
    const discordClient = this.discordProvider.getClient();

    const armaPingChannel: TextChannel = discordClient.channels.cache.get(
      process.env.ARMA_PINGS_CHANNEL_ID,
    ) as TextChannel;

    if (this.maintenanceMode) {
      console.log('maintenanceMode');
      await MayPostTeamspeakViewer(discordClient);
      return;
    }

    const messageId = Settings.get().messageId;
    const query = await this.query;

    if (messageId && !forceNewMessage) {
      console.log(`old server status message id found ${messageId}`);
      try {
        const oldMessage = await armaPingChannel.messages.fetch(messageId);
        const embed = await this.createRichEmbed(query);

        const editing = oldMessage.edit({ embeds: [embed] });
        editing
          .then(() => {
            console.log(`server status message edited`);
            this.setActivity(query ? 'ok' : 'serverError', query);
          })
          .catch((error) => {
            this.setActivity('botError');
            console.error(`Failed to edit current message, id: ${messageId}.`);
            console.error(error);
          });
      } catch (error) {
        console.log(`Error trying to get old server status message `);
        console.error(error);
      }
    } else {
      if (forceNewMessage && messageId) {
        console.log(`Deleting old server status message`);
        const message = await armaPingChannel.messages.fetch(messageId);
        await message.delete();
      }

      console.log(`Posting new server status message`);
      const embed = await this.createRichEmbed(query);
      armaPingChannel
        .send({ embeds: [embed] })
        .then((newMessage) => {
          Settings.set('messageId', newMessage.id);
          this.setActivity(query ? 'ok' : 'serverError', query);
        })
        .catch((error) => {
          this.setActivity('botError');
          console.error('Failed to create a new message.');
          console.error(error);
        });
    }
    const errorMessageId = Settings.get().errorMessageId;
    if (!query) {
      if (!errorMessageId) {
        console.log(`An arma server error occured, pinging admins`);
        const ping = this.generatePing(process.env.DISCORD_ADMIN_ROLE_ID);
        const content = `${ping}${locale.serverDownMessages.pingMessage}`;

        armaPingChannel.send(content).then((newMessage) => {
          Settings.set('errorMessageId', newMessage.id);
        });
      }
    } else {
      console.log(`Server back online, removing ping message`);
      this.removeErrorMessage(armaPingChannel);
    }
    // Post role ping message if threshold reached
    if (query) {
      console.log(`Server online`);
      const minPlayers = parseInt(process.env.MINIMUM_PLAYER_COUNT_FOR_PING);

      if (query.players.length >= minPlayers) {
        // Don't duplicate the message
        console.log(`Pinging players`);
        if (!Settings.get().pingMessageId) {
          armaPingChannel
            .send(
              this.generatePing(process.env.ARMA_PINGS_ROLE_ID) +
              ` ${minPlayers} ${locale.pingMessage}`,
            )
            .then((newMessage) => {
              Settings.set('pingMessageId', newMessage.id);
              Settings.set('lastPingMessageTime', new Date().toISOString());
            })
            .catch((error) => {
              this.setActivity('botError');
              console.error('Failed to create a new message.');
              console.error(error);
            });
        }
      } else {
        console.log(
          `Player count lowered bellow ${minPlayers}, removing ping message`,
        );
        const settings = Settings.get();
        if (settings.pingMessageId && settings.lastPingMessageTime) {
          if (
            Time.getDiffMinutes(
              new Date(),
              new Date(settings.lastPingMessageTime),
            ) >= parseInt(process.env.TIMEOUT_BETWEEN_PLAYER_PINGS_IN_MINUTES)
          ) {
            try {
              const message = await armaPingChannel.messages.fetch(
                settings.pingMessageId,
              );
              await message.delete();
            } catch (error) { }

            Settings.set('pingMessageId', undefined);
          }
        }
      }
      await MayPostTeamspeakViewer(discordClient);
    }
  }

  private async removeErrorMessage(channel: TextChannel) {
    const errorMessageId = Settings.get().errorMessageId;
    if (errorMessageId) {
      const message = await channel.messages.fetch(errorMessageId);
      await message.delete();

      Settings.set('errorMessageId', undefined);
    }
  }

  loopPolling() {
    const timeToWait = process.env.POLLING_INTERVAL_SECONDS;
    setInterval(() => {
      this.startPolling();
    }, parseInt(timeToWait) * 1000);
  }

  private get query(): Promise<QueryResult | undefined> {
    return new Promise((resolve) => {
      this.server
        .queryServer()
        .then((query) => {
          if (query) {
            resolve(query);
          } else {
            this.refreshFails++;
            console.warn(
              `Failed to refresh server info.`,
              `Remaining retries: ${this.refreshFails}/${this.maxRefreshFails}`,
            );
            if (this.refreshFails >= this.maxRefreshFails) {
              this.refreshFails = 0;
              try {
                const discordClient = this.discordProvider.getClient();
                const armaPingChannel: TextChannel =
                  discordClient.channels.cache.get(
                    process.env.ARMA_PINGS_CHANNEL_ID,
                  ) as TextChannel;
              } catch (error) { }
              console.error('Failed to refresh server info, emitting error.');
              resolve(undefined);
            }
          }
        })
        .catch(() => {
          console.log('Server is offline');
        });
    });
  }

  private getDescriptionRepeater(text: string): string {
    // Repeat the dashes for 62.5% of the text length
    return '─'.repeat(text.length * 0.625);
  }

  private async getSuccessFields(query: QueryResult): Promise<IField[]> {
    const playerListData = ['```py'];
    // Check if the embed doesn't go over the maximum allowed Discord value
    let hasPlayers = true;
    if (
      query.players.length &&
      this.getPlayerListCharacterCount(query.players) < 1024
    ) {
      // Sort alphabetically
      query.players.sort((a, b) =>
        a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
      );
      query.players.forEach((player) => {
        playerListData.push(this.getPlayerDisplayText(player));
      });
    } else if (query.players.length) {
      playerListData.push(locale.tooManyPlayers);
    } else {
      playerListData.push(locale.noPlayers);
      hasPlayers = false;
    }
    if (!hasPlayers) {
      return [
        {
          inline: true,
          name: locale.statuses.status,
          value: locale.statuses.online,
        },
        {
          inline: true,
          name: 'State',
          value: 'No Mission Loaded',
        },
      ];
    } else {
      let missionType = 'undefined';
      let typeLength = 2;
      const gameName: string = query.raw.game;
      if (gameName.substring(0, 5) == 'COTVT') {
        missionType = 'COTVT';
        typeLength = 5;
      } else {
        switch (gameName ? gameName.substring(0, 2) : 'undefined') {
          case 'CO': {
            missionType = 'COOP';
            break;
          }
          case 'TV': {
            missionType = 'TVT';
            typeLength = 3;
            break;
          }
          case 'LO': {
            missionType = 'LOL';
            typeLength = 3;
            break;
          }
          default: {
            missionType = 'undefined';
          }
        }
      }
      //console.log(`gameName:  ${gameName}`);
      //console.log(`missionType:  ${missionType}`);
      let missionName = 'undefined';
      let missionSlots = '64';
      if (missionType !== 'undefined') {
        const missionSlotsSearch = gameName.match(/[A-z]+([0-9]+)/);
        if (missionSlotsSearch && typeLength) {
          missionSlots = missionSlotsSearch[1];
          const missionNameSlice = gameName.slice(
            typeLength + missionSlots.length,
          );
          const missionNameSearch = missionNameSlice.match(/\w+.+/);
          missionName = missionNameSearch
            ? missionNameSearch[0].replace(/_/g, ' ')
            : 'undefined';
          //console.log(`missionSlots:  ${missionSlots}`);
          //console.log(`missionName:  ${missionName}`);
        }
        playerListData.push('```');
        return [
          {
            inline: false,
            name: locale.statuses.status,
            value: locale.statuses.online,
          },
          {
            inline: true,
            name: 'Mission Type',
            value: missionType,
          },
          {
            inline: true,
            name: locale.mission,
            value: missionName,
          },
          {
            inline: true,
            name: '\u200b',
            value: '\u200b',
          },
          {
            inline: true,
            name: locale.playerCount,
            value: `${query.players.length}/${missionSlots}`,
          },
          {
            inline: true,
            name: locale.map,
            value: query.map ? query.map : locale.noMap,
          },
          {
            inline: true,
            name: '\u200b',
            value: '\u200b',
          },
          {
            inline: false,
            name: locale.playerList,
            value: playerListData.join('\n'),
          },
        ];
      } else {
        playerListData.push('```');
        return [
          {
            inline: false,
            name: locale.statuses.status,
            value: locale.statuses.online,
          },
          {
            inline: true,
            name: 'Mission Type',
            value: "Custom",
          },
          {
            inline: true,
            name: locale.mission,
            value: query.raw.game,
          },
          {
            inline: true,
            name: '\u200b',
            value: '\u200b',
          },
          {
            inline: true,
            name: locale.playerCount,
            value: `${query.players.length}/${query.maxplayers}`,
          },
          {
            inline: true,
            name: locale.map,
            value: query.map ? query.map : locale.noMap,
          },
          {
            inline: true,
            name: '\u200b',
            value: '\u200b',
          },
          {
            inline: false,
            name: locale.playerList,
            value: playerListData.join('\n'),
          },
        ];
      }
    }
  }

  private getMaintenanceFields(): IField[] {
    return [
      {
        inline: false,
        name: locale.statuses.status,
        value: locale.statuses.offline,
      },
      {
        inline: false,
        name: locale.serverDownForMaintenance,
        value: locale.serverDownForMaintenanceDescription,
      },
    ];
  }

  public generatePing(id: string): string {
    return `<@&${id}>`;
  }

  private getErrorFields(): IField[] {
    return [
      {
        inline: false,
        name: locale.statuses.status,
        value: locale.statuses.offline,
      },
      {
        inline: false,
        name: locale.serverDownMessages.serverDownAlternative,
        value:
          `${this.generatePing(process.env.DISCORD_ADMIN_ROLE_ID)}` +
          `${locale.serverDownMessages.pleaseFixServer}`,
      },
    ];
  }

  public async createRichEmbed(query?: QueryResult, maintenanceMode?: boolean) {
    if (query) {
      return new EmbedBuilder({
        color: COLOR_OK,
        // As the ─ is just a little larger than the actual letters, it isn't equal to the letter count
        description: this.getDescriptionRepeater(query.name),
        fields: await this.getSuccessFields(query),
        timestamp: new Date(),
        thumbnail: {
          url: 'https://globalconflicts.net/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbanner.8d01371c.png&w=1080&q=100',
        },
        //title: query.name,
        title: locale.serverName,
      });
    } else if (maintenanceMode) {
      return new EmbedBuilder({
        color: COLOR_MAINTENANCE,
        description: locale.serverDownForMaintenance,
        fields: this.getMaintenanceFields(),
        timestamp: new Date(),
        title: locale.serverDownForMaintenance,
      });
    } else {
      return new EmbedBuilder({
        color: COLOR_ERROR,
        description: locale.serverOffline,
        fields: this.getErrorFields(),
        timestamp: new Date(),
        title: locale.serverOffline,
      });
    }
  }

  public async setActivity(
    status: 'ok' | 'serverError' | 'botError' | 'maintenance',
    query?: QueryResult,
  ) {
    const _client = await this.discordProvider.getClient();
    if (query && status === 'ok') {
      if (query.players.length) {
        let missionType = 'undefined';
        let typeLength = 2;
        const gameName: string = query.raw['game'];
        if (gameName.substring(0, 5) == 'COTVT') {
          missionType = 'COTVT';
          typeLength = 5;
        } else {
          switch (gameName ? gameName.substring(0, 2) : 'undefined') {
            case 'CO': {
              missionType = 'COOP';
              break;
            }
            case 'TV': {
              missionType = 'TVT';
              typeLength = 3;
              break;
            }
            case 'LO': {
              missionType = 'LOL';
              typeLength = 3;
              break;
            }
            default: {
              missionType = 'undefined';
            }
          }
        }

        let missionName = 'undefined';
        let missionSlots = '64';
        let name = `Unknown mission on ${query.map}`;
        if (missionType !== 'undefined') {
          const missionSlotsSearch = gameName.match(/[A-z]+([0-9]+)/);
          if (missionSlotsSearch && typeLength) {
            missionSlots = missionSlotsSearch[1];
            const missionNameSlice = gameName.slice(
              typeLength + missionSlots.length,
            );
            const missionNameSearch = missionNameSlice.match(/\w+.+/);
            missionName = missionNameSearch
              ? missionNameSearch[0].replace(/_/g, ' ')
              : 'undefined';
          }
          name = `${missionType} - ${missionName} on ${query.map} (${query.players.length}/${missionSlots})`;
        } else {
          name = `${query.raw.game} on ${query.map} (${query.players.length}/${query.maxplayers})`;
        }

        if (!query.map) {
          name = `${locale.noMap} (${query.players.length}/${query.maxplayers})`;
        }

        _client.user.setPresence({
          status: 'online',
          activities: [
            {
              name,
              type: ActivityType.Playing
            },
          ],
        });
      } else {
        const name = `${locale.noMap}`;

        _client.user.setPresence({
          status: 'online',
          activities: [
            {
              name,
              type: ActivityType.Playing
            },
          ],
        });
      }
    } else if (status === 'serverError') {
      _client.user.setPresence({
        status: 'dnd',
        activities: [
          {
            name: locale.presence.error,
            type: ActivityType.Watching
          },
        ],
      });
    } else if (status === 'maintenance') {
      _client.user.setPresence({
        status: 'idle',
        activities: [
          {
            name: locale.presence.maintenance,
            type: ActivityType.Watching
          },
        ],
      });
    } else {
      _client.user.setPresence({
        status: 'idle',
        activities: [
          {
            name: locale.presence.botFailure,
            type: ActivityType.Streaming
          },
        ],
      });
    }
  }
  private getPlayerDisplayText(player: Player): string {
    return `• ${player.name}`;
  }

  private getPlayerListCharacterCount(players: Player[]): number {
    return players
      .map((p) => this.getPlayerDisplayText(p).length)
      .reduce((prev, curr) => prev + curr);
  }
}

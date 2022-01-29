import { DiscordClientProvider } from '@discord-nestjs/core';
import { Body, Controller, Post } from '@nestjs/common';
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  TextChannel,
} from 'discord.js';
import { MessageButtonStyles } from 'discord.js/typings/enums';

export const REVIEW_STATE_REPROVED = 'review_reproved';
export const REVIEW_STATE_ACCEPTED = 'review_accepted';
export const REVIEW_STATE_PENDING = 'review_pending';

@Controller('missions')
export class MissionsController {
  constructor(private readonly discordProvider: DiscordClientProvider) {}

  @Post('/new')
  async newMission(@Body() body): Promise<object> {
    console.log(body);
    const newMissionEmbed = new MessageEmbed()
      .setColor('#ffffff')
      .setTitle(body.name)
      .setAuthor(`Author: ${body.author}`, body.displayAvatarURL)
      .addFields(
        { name: 'Description:', value: body.description, inline: false },
        {
          name: 'Player Count:',
          value: `**Min:** ${body.size.min} **Max:** ${body.size.max}`,
          inline: true,
        },
        { name: 'Type:', value: body.type, inline: true },
        { name: 'Map:', value: body.terrainName, inline: true },
        {
          name: 'Tags:',
          value: body.tags.join(' | '),
          inline: false,
        },
      )
      .setTimestamp()
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);
    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_CHANNEL,
    ) as TextChannel;
    await channel.send({ embeds: [newMissionEmbed] });
    return;
  }

  @Post('/request_audit')
  async requestAudit(@Body() body): Promise<object> {
    const newMissionEmbed = new MessageEmbed()
      .setColor('#22cf26')
      .setTitle(body.name)
      .setAuthor(`Author: ${body.author}`, body.displayAvatarURL)
      .setDescription(`Version: ${body.version}.`)
      .setTimestamp()
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);

    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_MISSION_REVIEWER_CHANNEL,
    ) as TextChannel;
    await channel.send({
      content: `<@&${process.env.DISCORD_MISSION_REVIEW_TEAM_ROLE_ID}>, a mission review has been requested.`,
      embeds: [newMissionEmbed],
    });
    return;
  }

  @Post('/audit_submited')
  async audit_submited(@Body() body): Promise<object> {
    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_CHANNEL,
    ) as TextChannel;

    const newMissionEmbed = new MessageEmbed()

      .setColor(
        `${body.reviewState === REVIEW_STATE_REPROVED ? '#ff0000' : '#56ff3b'}`,
      )
      .setTitle(`${body.name}`)

      .setDescription(
        `Version:   ${body.version}
			${
        body.notes != null
          ? `**Notes**:
			${body.notes}
			`
          : ''
      }
		`,
      )
      .setTimestamp()
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);

    if (body.reviewState === REVIEW_STATE_REPROVED) {
      for (const checklistElement of body.checklist) {
        if (checklistElement.value === 'FALSE') {
          newMissionEmbed.addField(
            checklistElement.text,
            checklistElement.value == 'FALSE' ? 'NO' : 'YES',
          );
        }
      }
      newMissionEmbed.addField('Reviewer', `<@${body.reviewer}>`);
      await channel.send({
        content: `<@${body.authorId}>, your mission has been rejected. 🛑`,
        embeds: [newMissionEmbed],
      });
    } else {
      newMissionEmbed.addField('Reviewer', `<@${body.reviewer}>`);
      await channel.send({
        content: `<@&${process.env.DISCORD_ADMIN_ROLE_ID}>, a mission was accepted to be uploaded:\n<@${body.authorId}>, your mission has been accepted. ✅`,
        embeds: [newMissionEmbed],
      });
    }

    return;
  }

  @Post('/new_history')
  async new_history(@Body() body): Promise<object> {
    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_AAR_CHANNEL,
    ) as TextChannel;

    const leadersDescriptionText = body.leaders
      .map(function (elem) {
        return `<@${elem.discordID}>`;
      })
      .join(', ');

    const leadersFieldText = body.leaders
      .map(function (elem) {
        return `<@${elem.discordID}>`;
      })
      .join('\n');

    let leaderText = 'Leader:';
    if (body.leaders.length > 1) {
      leaderText = 'Leaders:';
    }
    let sendText = `New mission history recorded!\n${leadersDescriptionText}: please consider giving your AAR at the website.`;
    if (!body.isNew) {
      sendText = `A mission history was edited. \n${leadersDescriptionText}: Check it out.`;
    }

    const gameplayHistoryEmbed = new MessageEmbed()
      .setTitle(`${body.name}`)
      .setAuthor(`Author: ${body.author}`, body.displayAvatarURL)
      .addField('Outcome:', body.outcome)
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);

    if (body.gmNote) {
      gameplayHistoryEmbed.addField('GM Notes:', body.gmNote);
    }
    if (body.aarReplayLink) {
      gameplayHistoryEmbed.addField('AAR Replay:', body.aarReplayLink);
    }
    gameplayHistoryEmbed.addField(leaderText, leadersFieldText);

    await channel.send({ content: sendText, embeds: [gameplayHistoryEmbed] });
    return;
  }

  @Post('/first_vote')
  async first_vote(@Body() body): Promise<object> {
    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_VOTING_CHANNEL,
    ) as TextChannel;

    const newMissionEmbed = new MessageEmbed()
      .setTitle(`${body.name}`)
      .setAuthor(`Author: ${body.author}`, body.displayAvatarURL)
      .setDescription(body.description)
      .addFields(
        { name: 'Type:', value: body.type, inline: true },
        { name: 'Terrain:', value: body.terrain, inline: true },
      )
      .setURL(`https://globalconflicts.net/mission-details/${body.uniqueName}`);

    const discordButton = new MessageButton()
      .setLabel('Vote for this mission')
      .setCustomId(body.uniqueName)
      .setStyle(MessageButtonStyles.PRIMARY);

    const row = new MessageActionRow({ components: [discordButton] });

    await channel.send({
      content: `This mission has received its first vote:`,
      embeds: [newMissionEmbed],
      components: [row],
    });

    return;
  }

  @Post('/bugreport')
  async bugreport(@Body() body): Promise<object> {
    const embed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle(`Mission: ${body.name}`)
      .setAuthor(
        `Bug report author: ${body.reportAuthor}`,
        body.reviewDisplayAvatarURL,
      )
      .addFields({ name: 'Version:', value: body.version, inline: false })
      .addFields({ name: 'Bug report:', value: body.report, inline: false })
      .setTimestamp()
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);

    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_CHANNEL,
    ) as TextChannel;
    await channel.send({
      content: `New bug report added, <@${body.authorId}>.`,
      embeds: [embed],
    });
    return;
  }

  @Post('/review')
  async review(@Body() body): Promise<object> {
    const embed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle(`Mission: ${body.name}`)
      .setAuthor(
        `Review author: ${body.reviewAuthor}`,
        body.reviewDisplayAvatarURL,
      )
      .addFields({ name: 'Review:', value: body.review, inline: false })
      .setTimestamp()
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);

    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.DISCORD_BOT_CHANNEL,
    ) as TextChannel;
    await channel.send({
      content: `New review added,  <@${body.authorId}>.`,
      embeds: [embed],
    });
    return;
  }

  @Post('/media_posted')
  async media_posted(@Body() body): Promise<object> {
    console.log('POSTING MEDIA');
    const embed = new MessageEmbed()
      .setColor('#0000FF')
      .setTitle(`Mission: ${body.name}`)
      .setDescription('New media posted!')
      .setAuthor(
        `Media poster: ${body.mediaAuthor}`,
        body.mediaDisplayAvatarURL,
      )
      .setURL(`https://globalconflicts.net/missions/${body.uniqueName}`);

    const discordClient = this.discordProvider.getClient();
    const channel: TextChannel = discordClient.channels.cache.get(
      process.env.ARMA_MEDIA_CHANNEL,
    ) as TextChannel;
    await channel.send({
      embeds: [embed],
    });
    let linksText = '';
    for (const link of body.mediaLinkList) {
      linksText = `${linksText}\n${link.link}`;
    }
    await channel.send({
      content: linksText,
    });
    return;
  }
}

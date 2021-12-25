import { DiscordClientProvider } from '@discord-nestjs/core';
import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly discordProvider: DiscordClientProvider) {}

  @Get()
  async findAll(): Promise<object> {
    const gcGuild = this.discordProvider
      .getClient()
      .guilds.cache.get(process.env.DISCORD_SERVER_ID);

    const members = await gcGuild.members.fetch();
    return members;
  }
  @Get('/donators')
  async findDonators(): Promise<object> {
    const gcGuild = this.discordProvider
      .getClient()
      .guilds.cache.get(process.env.DISCORD_SERVER_ID);

    await gcGuild.roles.fetch();
    await gcGuild.members.fetch();

    const donatorRole = gcGuild.roles.cache.get(
      process.env.DISCORD_DONATOR_ROLE_ID,
    );

    return donatorRole.members;
  }

  @Get('/:id')
  async findUser(@Param() params): Promise<object> {
    const gcGuild = this.discordProvider
      .getClient()
      .guilds.cache.get(process.env.DISCORD_SERVER_ID);

    await gcGuild.roles.fetch();
    await gcGuild.members.fetch();
    const userFound = gcGuild.members.cache.get(params.id);

    userFound['rolesMap'] = [];
    userFound.roles.cache
      .filter((value) => value.name != '@everyone')
      .forEach(function (value) {
        userFound['rolesMap'].push({
          id: value.id,
          name: value.name,
          color: value.hexColor,
        });
      });

    return userFound;
  }
}

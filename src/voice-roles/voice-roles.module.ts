// src/voice-roles/voice-roles.module.ts
import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { VoiceRolesService } from './voice-roles.service';

@Module({
  imports: [DiscordModule.forFeature()], // Import DiscordModule to access the Discord client
  providers: [VoiceRolesService],
})
export class VoiceRolesModule {}
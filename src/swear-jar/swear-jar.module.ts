import { Module } from '@nestjs/common';
import { SwearJarService } from './swear-jar.service';
import { DiscordModule } from '@discord-nestjs/core';

@Module({
  imports: [DiscordModule.forFeature()], // Use forFeature() to access the shared Discord client
  providers: [SwearJarService],
  exports: [SwearJarService],
})
export class SwearJarModule {}
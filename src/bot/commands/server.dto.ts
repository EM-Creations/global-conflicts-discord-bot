import { Param, ParamType } from '@discord-nestjs/core';
import { Transform } from 'class-transformer';

export class ServerDTO {
    @Transform(({ value }) => value.toUpperCase())
  
    server: string;
}
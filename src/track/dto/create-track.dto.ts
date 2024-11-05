import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  @MinLength(3)
  @MaxLength(36)
  name: string;
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  artist: string;
  @IsString()
  @IsOptional()
  text?: string;
  @IsOptional()
  albumId?: string;
  @IsString()
  @IsOptional()
  picture?: string;
}

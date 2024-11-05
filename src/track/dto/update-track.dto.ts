import { IsOptional, IsString } from 'class-validator';

export class UpdateTrackDto {
  @IsString()
  @IsOptional()
  name?: string;
  @IsString()
  @IsOptional()
  artist?: string;
  @IsString()
  @IsOptional()
  text?: string;
}

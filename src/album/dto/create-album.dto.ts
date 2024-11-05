import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @MinLength(4)
  @MaxLength(24)
  title: string;
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  genre: string;
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(16)
  artist?: string;
  @IsString()
  @IsOptional()
  picture?: string;
}

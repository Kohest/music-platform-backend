import { PartialType } from '@nestjs/mapped-types';
import { CreateAlbumDto } from './create-album.dto';
import { IsOptional, Max, Min } from 'class-validator';

export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {
  @IsOptional()
  tracks?: string[];
  @IsOptional()
  @Min(1000, { message: 'Year must be at least 1000' })
  @Max(new Date().getFullYear(), {
    message: `Year cannot exceed ${new Date().getFullYear()}`,
  })
  year?: number;
}

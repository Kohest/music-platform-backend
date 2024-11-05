import { IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CreateCommentDto {
  @IsString()
  readonly text: string;
  readonly trackId: ObjectId;
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import * as mongoose from 'mongoose';
import { Album } from 'src/album/schemas/album.schema';
import { Track } from 'src/track/schemas/track.schema';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;
  @Prop()
  @IsOptional()
  avatar?: string;
  @Prop()
  password: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }] })
  favoredTracks: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }] })
  favoredAlbums: mongoose.Schema.Types.ObjectId[];
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }] })
  myTracks: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }] })
  myAlbums: mongoose.Schema.Types.ObjectId[];
  _id: any;
}

export const UserSchema = SchemaFactory.createForClass(User);

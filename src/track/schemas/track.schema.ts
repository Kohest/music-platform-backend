import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
export type TrackDocument = Track & Document;
@Schema()
@Schema()
export class Track {
  @Prop()
  name: string;

  @Prop()
  text: string;

  @Prop()
  artist: string;

  @Prop()
  listens: number;
  @Prop({ default: Date.now })
  createdAt: Date;
  @Prop()
  picture: string;

  @Prop()
  audio: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] })
  comments: Comment[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Album' })
  albumId?: mongoose.Schema.Types.ObjectId;
}
export const TrackSchema = SchemaFactory.createForClass(Track);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
export type AlbumDocument = Album & Document;
@Schema()
export class Album {
  @Prop()
  title: string;
  @Prop()
  genre: string;
  @Prop()
  artist: string;
  @Prop()
  year: number;
  @Prop({ default: Date.now })
  createdAt: Date;
  @Prop()
  picture: string;
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }] })
  tracks: mongoose.Schema.Types.ObjectId[];
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Schema.Types.ObjectId;
}
export const AlbumSchema = SchemaFactory.createForClass(Album);

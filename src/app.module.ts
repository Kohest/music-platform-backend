import { Module } from '@nestjs/common';
import { TrackModule } from './track/track.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AlbumModule } from './album/album.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_URL || 'mongodb://localhost/27017'),
    ServeStaticModule.forRoot({
      rootPath: path.resolve(__dirname, 'static'),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TrackModule,
    FileModule,
    AlbumModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
})
export class AppModule {}

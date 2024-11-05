import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { jwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { AlbumService } from './album.service';
import { CurrentUser } from 'src/auth/decorators/user.decorators';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ObjectId } from 'mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}
  @Get()
  getAllAlbums(@Query('count') count: number, @Query('offset') offset: number) {
    return this.albumService.getAllAlbums(count, offset);
  }
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  @Get('user')
  getUserAlbums(
    @Query('count') count: number,
    @Query('offset') offset: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.albumService.getUserAlbums(count, offset, userId);
  }
  @Post('multiple')
  getMultipleTracks(@Body('ids') ids: string[]) {
    return this.albumService.getMultipleAlbums(ids);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'picture', maxCount: 1 }]))
  createAlbum(
    @Body() dto: CreateAlbumDto,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files,
  ) {
    const picture = files?.picture ? files.picture[0] : null;
    return this.albumService.createAlbum(dto, userId, picture);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'picture', maxCount: 1 }]))
  updateAlbum(
    @Body() dto: UpdateAlbumDto,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files,
  ) {
    const picture = files?.picture ? files.picture[0] : null;
    return this.albumService.updateAlbum(id, dto, userId, picture);
  }

  @Delete(':id')
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  deleteAlbum(@Param('id') id: ObjectId, @CurrentUser('id') userId: ObjectId) {
    return this.albumService.deleteAlbum(id, userId);
  }
  @Get(':id')
  getAlbumById(@Param('id') id: string) {
    return this.albumService.getAlbumById(id);
  }
  @Get('favorite/me')
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  getUserFavorite(@CurrentUser('id') userId: ObjectId) {
    return this.albumService.getFavorite(userId);
  }
  @Get('favorite/:id') //конкретно передается id пользователя
  getProfileFavorite(
    @Param('id') userId: string,
    @Query('type') type: 'all' | 'favored' | 'myAlbums' = 'all',
    @Query('name') name: 'asc' | 'desc',
    @Query('date') date: 'asc' | 'desc',
  ) {
    return this.albumService.getAlbumsFilter(userId, type, name, date);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('favorite/:id')
  addFavorite(@Param('id') id: ObjectId, @CurrentUser('id') userId: string) {
    return this.albumService.addFavorite(id, userId);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Delete('favorite/:id')
  deleteFavorite(@Param('id') id: ObjectId, @CurrentUser('id') userId: string) {
    return this.albumService.deleteFavorite(id, userId);
  }
  @Delete(':albumId/tracks/:trackId')
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  deleteTrackFromAlbum(
    @Param('albumId') albumId: ObjectId,
    @Param('trackId') trackId: ObjectId,
    @CurrentUser('id') userId: ObjectId,
  ) {
    return this.albumService.deleteTrackFromAlbum(albumId, trackId, userId);
  }
}

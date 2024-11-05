import {
  BadRequestException,
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
import { TrackService } from './track.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { ObjectId } from 'mongoose';
import { CreateCommentDto } from './dto/craete-comment-dto';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { jwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { CurrentUser } from 'src/auth/decorators/user.decorators';
import { UpdateTrackDto } from './dto/update-track.dto';
@Controller('/tracks')
export class TrackController {
  constructor(private trackService: TrackService) {}
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'picture', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
    ]),
  )
  create(
    @UploadedFiles() files,
    @Body() dto: CreateTrackDto,
    @CurrentUser('id') userId: string,
  ) {
    const audio = files?.audio?.[0];
    const picture = files?.picture ? files.picture[0] : null;
    return this.trackService.create(dto, picture, audio, userId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @UseGuards(jwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Body() dto: UpdateTrackDto,
    @Param('id') trackId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.trackService.update(dto, userId, trackId);
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.trackService.getAll(count, offset);
  }
  @Get('user')
  getUserTracks(
    @Query('count') count: number,
    @Query('offset') offset: number,
    @CurrentUser('id') userId: ObjectId,
  ) {
    return this.trackService.getUserTracks(count, offset, userId);
  }
  @Get('/search')
  search(
    @Query('text') text: string,
    @Query('type') type: 'all' | 'albums' | 'tracks' = 'all',
  ) {
    return this.trackService.search(text, type);
  }

  @Get('favorite/me')
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  getUserFavorite(@CurrentUser('id') userId: string) {
    return this.trackService.getFavorite(userId);
  }

  @Get('favorite/:id')
  getProfileFavorite(
    @Param('id') userId: string,
    @Query('type') type: 'all' | 'favored' | 'myTracks' = 'all',
    @Query('title') title: 'asc' | 'desc' = 'asc',
    @Query('artist') artist: 'asc' | 'desc' = 'asc',
  ) {
    return this.trackService.getTracks(userId, type, title, artist);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('favorite/:id')
  addFavorite(@Param('id') id: ObjectId, @CurrentUser('id') userId: string) {
    return this.trackService.addFavorite(id, userId);
  }
  @Post('multiple')
  getMultipleTracks(@Body('ids') ids: string[]) {
    return this.trackService.getMultipleTracks(ids);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Delete('favorite/:id')
  deleteFavorite(@Param('id') id: ObjectId, @CurrentUser('id') userId: string) {
    return this.trackService.deleteFavorite(id, userId);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.trackService.delete(id, userId);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('/comment')
  addComment(@Body() dto: CreateCommentDto) {
    return this.trackService.addComment(dto);
  }
  @Post('/listen/:id')
  listen(@Param('id') id: ObjectId) {
    return this.trackService.listen(id);
  }
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.trackService.getOne(id);
  }
}

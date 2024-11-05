import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAlbumDto } from './dto/create-album.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Album, AlbumDocument } from './schemas/album.schema';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { FileService, FileType } from 'src/file/file.service';
import { Track } from 'src/track/schemas/track.schema';

@Injectable()
export class AlbumService {
  constructor(
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    @InjectModel(Track.name) private trackModel: Model<AlbumDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private fileService: FileService,
  ) {}
  async createAlbum(
    dto: CreateAlbumDto,
    userId: string,
    picture,
  ): Promise<Album> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (picture) {
      const picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      dto.picture = picturePath;
    }
    const album = await this.albumModel.create({
      ...dto,
      year: new Date().getFullYear(),
      picture: '',
      createdAt: new Date(),
      tracks: [],
      userId,
    });
    user.myAlbums.push(album.id);
    await user.save();
    return album;
  }
  async updateAlbum(
    id: string,
    dto: UpdateAlbumDto,
    userId: string,
    picture,
  ): Promise<Album> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const album = await this.albumModel.findById(id);
    if (!album) throw new NotFoundException('Album not found');
    if (picture && album.picture.length) {
      this.fileService.removeFile(album.picture);
    }
    if (picture) {
      const picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      dto.picture = picturePath;
    }
    if (album.userId.toString() !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to edit this album',
      );
    }
    const updatedTracks = Array.from(
      new Set([...album.tracks, ...(dto.tracks || [])]),
    );
    await album.updateOne({ ...dto, tracks: updatedTracks });
    return this.albumModel.findById(id).populate('tracks');
  }
  async getAllAlbums(count = 10, offset = 0): Promise<Album[]> {
    const albums = await this.albumModel
      .find()
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(count));
    return albums;
  }

  async getAlbumById(id: string) {
    if (!isValidObjectId(id)) {
      throw new Error('Неверный формат ID альбома');
    }
    const album = await this.albumModel.findById(id);
    if (!album) {
      throw new Error('Альбом не найден');
    }
    const tracks = await this.trackModel.find({ _id: { $in: album.tracks } });
    const fullAlbum = {
      ...album.toObject(),
      tracks,
    };
    return fullAlbum;
  }
  async getUserAlbums(
    count = 10,
    offset = 0,
    userId: number,
  ): Promise<Album[]> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const albums = await this.albumModel
      .find({ userId: userId })
      .skip(Number(offset))
      .limit(Number(count))
      .populate('tracks');
    return albums;
  }
  async getFavorite(userId: ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user.favoredAlbums;
  }
  async getAlbumsFilter(
    userId: string,
    type: 'all' | 'favored' | 'myAlbums',
    name: 'asc' | 'desc',
    date: 'asc' | 'desc',
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let albumIds = [];
    switch (type) {
      case 'favored':
        albumIds = user.favoredAlbums || [];
        break;
      case 'myAlbums':
        albumIds = user.myAlbums || [];
        break;
      case 'all':
      default:
        albumIds = [...(user.favoredAlbums || []), ...(user.myAlbums || [])];
    }
    const albums = await this.getMultipleAlbums(albumIds);
    albums.sort((a, b) => {
      if (name) {
        const titleComparison =
          name === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        if (titleComparison !== 0) return titleComparison;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return date === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return albums;
  }
  async getMultipleAlbums(ids: string[]): Promise<Album[]> {
    const albums = await this.albumModel.find({ _id: { $in: ids } });
    return albums;
  }
  async addFavorite(id: ObjectId, userId: string) {
    const album = await this.albumModel.findById(id);
    const user = await this.userModel.findById(userId);
    if (!album) throw new NotFoundException('Album not found');
    if (!user) throw new NotFoundException('User not found');
    if (user.favoredAlbums.includes(album.id)) {
      throw new UnauthorizedException('Album already in favorites');
    }
    user.favoredAlbums.push(album.id);
    await user.save();
    return { message: 'Album added to favorites' };
  }
  async deleteFavorite(id: ObjectId, userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.favoredAlbums = user.favoredAlbums.filter(
      (trackId) => trackId.toString() !== id.toString(),
    );
    await user.save();
  }
  async deleteAlbum(id: ObjectId, userId: ObjectId) {
    const album = await this.albumModel.findOne({
      _id: id,
      userId: userId,
    });
    if (!album) {
      throw new NotFoundException(
        'Album not found or you do not have permission to delete this album',
      );
    }
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { myAlbums: id } },
    );
    await this.userModel.updateMany(
      { favoredAlbums: id },
      { $pull: { favoredAlbums: id } },
    );

    await this.albumModel.findByIdAndDelete(id);
    if (album.picture && album.picture.length) {
      this.fileService.removeFile(album.picture);
    }
    await this.trackModel.updateMany(
      { albumId: id },
      { $set: { picture: '' } },
    );

    return album.id;
  }
  async deleteTrackFromAlbum(
    id: ObjectId,
    trackId: ObjectId,
    userId: ObjectId,
  ) {
    const album = await this.albumModel.findOne({
      _id: id,
      userId: userId,
    });
    if (!album) {
      throw new NotFoundException(
        'Track not found or you do not have permission to delete this album',
      );
    }
    const trackIndex = album.tracks.indexOf(trackId);
    if (trackIndex === -1) {
      throw new NotFoundException('Track not found in album');
    }
    album.tracks.splice(trackIndex, 1);
    await album.save();
    return album.id;
  }
}

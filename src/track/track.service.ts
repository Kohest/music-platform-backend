import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Track, TrackDocument } from './schemas/track.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateTrackDto } from './dto/create-track.dto';
import { CreateCommentDto } from './dto/craete-comment-dto';
import { FileService, FileType } from 'src/file/file.service';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Album, AlbumDocument } from 'src/album/schemas/album.schema';
import { UpdateTrackDto } from './dto/update-track.dto';
@Injectable()
export class TrackService {
  constructor(
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    private fileService: FileService,
  ) {}
  async create(
    dto: CreateTrackDto,
    picture,
    audio,
    userId: string,
  ): Promise<Track> {
    console.log(audio);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const audioPath = this.fileService.createFile(FileType.AUDIO, audio);
    if (picture) {
      const picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      dto.picture = picturePath;
    } else {
      const albumPicture = await this.albumModel.findById(dto.albumId);
      dto.picture = albumPicture.picture;
    }
    const track = await this.trackModel.create({
      ...dto,
      listens: 0,
      audio: audioPath,
      userId,
    });
    user.myTracks.push(track.id);
    if (dto.albumId) {
      const album = await this.albumModel.findById(dto.albumId);
      album.tracks.push(track.id);
      await album.save();
    }
    await user.save();
    return track;
  }
  async update(dto: UpdateTrackDto, userId: string, trackId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const track = await this.trackModel.findById(trackId);
    if (!track) throw new NotFoundException('Track not found');
    if (track.userId.toString() !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to edit this track',
      );
    }
    await track.updateOne({ ...dto });
    return track;
  }
  async getAll(count = 10, offset = 0): Promise<Track[]> {
    const tracks = await this.trackModel
      .find()
      .skip(Number(offset))
      .limit(Number(count));
    return tracks;
  }

  async getUserTracks(count = 10, offset = 0, userId: ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const albums = await this.trackModel
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(count));
    return albums;
  }
  async getOne(id: string): Promise<Track> {
    const track = await this.trackModel.findById(id).populate('comments');
    return track;
  }
  async delete(id: string, userId: string): Promise<ObjectId> {
    const track = await this.trackModel.findOne({
      _id: id,
      userId: userId,
    });
    if (!track) {
      throw new NotFoundException(
        'Track not found or you do not have permission to delete this track',
      );
    }
    await this.trackModel.findByIdAndDelete(id);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (track.audio && track.audio.length) {
      this.fileService.removeFile(track.audio);
    }
    if (track.picture && track.picture.length) {
      this.fileService.removeFile(track.picture);
    }

    user.myTracks = user.myTracks.filter(
      (trackId) => trackId.toString() !== id,
    );
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { myTracks: user.myTracks } },
    );

    await this.userModel.updateMany(
      { favoredTracks: id },
      { $pull: { favoredTracks: id } },
    );

    return track.id;
  }

  async addComment(dto: CreateCommentDto): Promise<Comment> {
    const track = await this.trackModel.findById(dto.trackId);
    const comment = await this.commentModel.create({ ...dto });
    track.comments.push(comment.id);
    await track.save();
    return comment;
  }
  async listen(id: ObjectId) {
    const track = await this.trackModel.findById(id);
    track.listens += 1;
    track.save();
  }
  async getFavorite(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user.favoredTracks;
  }
  async getTracks(
    userId: string,
    type: 'all' | 'favored' | 'myTracks',
    title: 'asc' | 'desc' | null = null,
    artist: 'asc' | 'desc' | null = null,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let trackIds = [];
    switch (type) {
      case 'favored':
        trackIds = user.favoredTracks || [];
        break;
      case 'myTracks':
        trackIds = user.myTracks || [];
        break;
      case 'all':
      default:
        trackIds = [...(user.favoredTracks || []), ...(user.myTracks || [])];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (title) sortOptions.name = title === 'asc' ? 1 : -1;
    if (artist) sortOptions.artist = artist === 'asc' ? 1 : -1;

    return this.getMultipleTracks(trackIds, sortOptions);
  }

  async getMultipleTracks(
    ids: string[],
    sortOptions: Record<string, 1 | -1> = {},
  ): Promise<Track[]> {
    const tracks = await this.trackModel
      .find({ _id: { $in: ids } })
      .sort(sortOptions);
    return tracks;
  }
  async addFavorite(id: ObjectId, userId: string) {
    const track = await this.trackModel.findById(id);
    const user = await this.userModel.findById(userId);
    if (!track) throw new NotFoundException('Track not found');
    if (!user) throw new NotFoundException('User not found');
    if (user.favoredTracks.includes(track.id)) {
      throw new UnauthorizedException('Track already in favorites');
    }
    user.favoredTracks.push(track.id);
    await user.save();
    return { message: 'Track added to favorites' };
  }
  async deleteFavorite(id: ObjectId, userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.favoredTracks = user.favoredTracks.filter(
      (trackId) => trackId.toString() !== id.toString(),
    );
    await user.save();
  }
  async search(
    text: string,
    type: string,
  ): Promise<{ tracks?: Track[]; albums?: Album[] }> {
    if (!text) {
      return { tracks: [], albums: [] };
    }
    const trackPromise = this.trackModel.find({
      $or: [
        { name: { $regex: new RegExp(text, 'i') } },
        { artist: { $regex: new RegExp(text, 'i') } },
      ],
    });

    const albumPromise = this.albumModel.find({
      $or: [
        { title: { $regex: new RegExp(text, 'i') } },
        { artist: { $regex: new RegExp(text, 'i') } },
      ],
    });

    if (type === 'tracks') {
      const tracks = await trackPromise;
      return { tracks };
    } else if (type === 'albums') {
      const albums = await albumPromise;
      return { albums };
    } else {
      const [tracks, albums] = await Promise.all([trackPromise, albumPromise]);
      return { tracks, albums };
    }
  }
}

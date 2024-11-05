import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { isValidObjectId, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { IGetUser, IUpdateUser } from 'src/types/types';
import { FileService, FileType } from 'src/file/file.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private fileService: FileService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const existUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existUser) {
      throw new BadRequestException('User already exists');
    }
    const user: User = await this.userModel.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: await argon2.hash(createUserDto.password),
    });

    const token = this.jwtService.sign({
      id: user._id,
      email: createUserDto.email,
      name: createUserDto.name,
    });
    return { _id: user._id, email: user.email, token };
  }

  async findOne(email: string) {
    return await this.userModel.findOne({ email });
  }
  async findById(id: string): Promise<IGetUser> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    avatar: any,
  ): Promise<IUpdateUser> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (avatar && user.avatar && user.avatar.length) {
      this.fileService.removeFile(user.avatar);
    }
    if (avatar) {
      const avatarPath = this.fileService.createFile(FileType.IMAGE, avatar);
      updateUserDto.avatar = avatarPath;
    }

    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    await user.updateOne({ ...updateUserDto });

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

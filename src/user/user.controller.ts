import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { jwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { CurrentUser } from 'src/auth/decorators/user.decorators';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.findById(userId);
  }
  @Get('profile/:id')
  async getPublicProfile(@Param('id') userId: string) {
    return this.userService.findById(userId);
  }
  @UseGuards(jwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Patch()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
    @UploadedFiles() files,
  ) {
    const avatar = files?.avatar ? files.avatar[0] : null;
    return this.userService.update(userId, dto, avatar);
  }
}

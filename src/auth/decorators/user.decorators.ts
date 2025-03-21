import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUser } from 'src/types/types';
import { User } from 'src/user/schemas/user.schema';

export const CurrentUser = createParamDecorator(
  (data: keyof IUser, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user[data] : user;
  },
);

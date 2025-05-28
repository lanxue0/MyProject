import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Request } from 'express';

export const RequireLogin = () => {
  return SetMetadata('require-login', true);
};

export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      return null;
    }

    return data ? request.user[data] : request.user;
  },
);

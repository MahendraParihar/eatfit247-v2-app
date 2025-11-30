import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestedIp = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
});

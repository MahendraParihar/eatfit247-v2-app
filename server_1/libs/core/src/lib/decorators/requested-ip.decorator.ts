import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestedIp = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();
  return req.ip || req.connection.remoteAddress;
});


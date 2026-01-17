import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PUBLIC_API } from '@eatfit247-shared-lib';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_API, [handler, controller]);
    // Debug logging to help diagnose the issue
    const controllerName = controller.name;
    const handlerName = handler.name;
    const metadata = this.reflector.get(PUBLIC_API, handler) || this.reflector.get(PUBLIC_API, controller);
    if (isPublic) {
      console.log(`[JwtAuthGuard] Allowing public access to ${controllerName}.${handlerName}`);
      return true;
    }
    console.log(`[JwtAuthGuard] Requiring authentication for ${controllerName}.${handlerName} (isPublic: ${isPublic}, metadata: ${metadata})`);
    return super.canActivate(context);
  }
}

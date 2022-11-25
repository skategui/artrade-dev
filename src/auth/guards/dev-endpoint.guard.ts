import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { Request } from 'express';
import { ConfigService } from '../../config/config.service';
import { AppLogger } from '../../logging/logging.service';

@Injectable()
export class DevEndpointGuard implements CanActivate {
  constructor(private readonly logger: AppLogger, private readonly configService: ConfigService) {
    this.logger.setContext(DevEndpointGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const req: Request = new ExecutionContextHost([ctx.getContext().req])
      .switchToHttp()
      .getRequest();
    const { devtoken: devToken } = req.headers;
    if (!devToken) {
      throw new AuthenticationError('Missing dev token');
    }
    if (devToken !== this.configService.devToken) {
      throw new ForbiddenError(`Invalid dev token`);
    }
    return true;
  }
}

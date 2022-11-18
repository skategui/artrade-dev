/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends ConsoleLogger {
  constructor(private conf: ConfigService) {
    super();
  }

  setContext(context: string) {
    super.context = context;
  }

  verbose(message: unknown) {
    if (this.conf.isDevelopment) {
      super.verbose(message);
    }
  }
}

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { AppLogger } from '../../logging/logging.service';

@Injectable()
export class SilentLogger extends AppLogger {
  constructor() {
    super({ isDevelopment: false } as ConfigService);
  }
  log() {}
  error() {}
  warn() {}
  debug() {}
  verbose() {}
  printMessages() {}
}

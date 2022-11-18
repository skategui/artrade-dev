/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class SilentLogger extends ConsoleLogger implements LoggerService {
  log() {}
  error() {}
  warn() {}
  debug() {}
  verbose() {}
  printMessages() {}
}

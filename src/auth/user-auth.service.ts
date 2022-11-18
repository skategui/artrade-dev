import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { Role } from '../auth/types';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../logging/logging.service';
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';

@Injectable()
export class UserAuthService extends AuthService<User> {
  constructor(
    logger: AppLogger,
    conf: ConfigService,
    jwtService: JwtService,
    userService: UserService,
  ) {
    super(userService, Role.User, logger, conf, jwtService);
    this.logger.setContext('UserAuthService');
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../logging/logging.service';
import { AdminService } from '../user/admin.service';
import { Admin } from '../user/model/admin.model';
import { AuthService } from './auth.service';
import { Role } from './types';

@Injectable()
export class AdminAuthService extends AuthService<Admin> {
  constructor(
    logger: AppLogger,
    conf: ConfigService,
    jwtService: JwtService,
    adminService: AdminService,
  ) {
    super(adminService, Role.Admin, logger, conf, jwtService);
    this.logger.setContext('AdminAuthService');
  }
}

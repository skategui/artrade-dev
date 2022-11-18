import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '../config/config.service';
import { UserModule } from '../user/user.module';
import { AdminAuthService } from './admin-auth.service';
import { AuthResolver } from './auth.resolver';
import { EndpointAuthMetadataManager } from './endpoint-auth-metadata-manager.service';
import { UserAuthService } from './user-auth.service';

export const jwtModule = JwtModule.registerAsync({
  imports: [],
  inject: [ConfigService],
  useFactory: (cf: ConfigService) => ({
    secret: cf.jwt.secret,
    signOptions: { expiresIn: cf.jwt.authExpire },
  }),
});

@Global()
@Module({
  imports: [HttpModule, jwtModule, PassportModule, UserModule],
  providers: [AuthResolver, EndpointAuthMetadataManager, UserAuthService, AdminAuthService],
  exports: [EndpointAuthMetadataManager, UserAuthService, AdminAuthService],
})
export class AuthModule {}

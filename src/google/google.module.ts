import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { GoogleUserInfoService } from './google-userinfo.service';
import { GoogleOauthResolver } from './google.resolver';
import { GoogleService } from './google.service';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [GoogleService, GoogleOauthResolver, GoogleUserInfoService],
})
export class GoogleModule {}

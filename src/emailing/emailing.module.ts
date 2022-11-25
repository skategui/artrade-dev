import { forwardRef, Module } from '@nestjs/common';
import { VerificationModule } from '../email-verification/email-verification.module';
import { UserModule } from '../user/user.module';
import { EmailingResolver } from './emailing.resolver';
import { EmailingService } from './emailing.service';

@Module({
  imports: [forwardRef(() => UserModule), VerificationModule],
  providers: [EmailingService, EmailingResolver],
  exports: [EmailingService],
})
export class EmailingModule {}

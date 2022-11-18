import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { VerificationModule } from '../verification/verification.module';
import { EmailingResolver } from './emailing.resolver';
import { EmailingService } from './emailing.service';

@Module({
  imports: [forwardRef(() => UserModule), VerificationModule],
  providers: [EmailingService, EmailingResolver],
  exports: [EmailingService],
})
export class EmailingModule {}

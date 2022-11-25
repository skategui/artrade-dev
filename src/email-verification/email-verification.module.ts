import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerification, EmailVerificationSchema } from './email-verification.model';
import { EmailVerificationService } from './email-verification.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    MongooseModule.forFeature([{ name: EmailVerification.name, schema: EmailVerificationSchema }]),
  ],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class VerificationModule {}

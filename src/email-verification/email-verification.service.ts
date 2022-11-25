import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from '../logging/logging.service';
import { CreateVerificationInputDto } from './dto/create-verification-input.dto';
import { EmailVerification } from './email-verification.model';

export class EmailVerificationService {
  constructor(
    private logger: AppLogger,
    @InjectModel(EmailVerification.name) private model: Model<EmailVerification>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create(verification: CreateVerificationInputDto): Promise<EmailVerification> {
    return (await this.model.create(verification)).toObject();
  }

  async getByEmail(email: string): Promise<EmailVerification | null> {
    return await this.model.findOne({ email }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }
}

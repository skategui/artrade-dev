import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from '../logging/logging.service';
import { CreateVerificationInputDto } from './dto/create-verification-input.dto';
import { Verification } from './verification.model';

export class VerificationService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Verification.name) private model: Model<Verification>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create(verification: CreateVerificationInputDto): Promise<Verification> {
    return (await this.model.create(verification)).toObject();
  }

  async getByEmail(email: string): Promise<Verification | null> {
    return await this.model.findOne({ email }).exec();
  }
}

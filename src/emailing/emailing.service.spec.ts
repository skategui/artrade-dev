import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '../config/config.service';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { EmailingService } from './emailing.service';

const configServiceMock: Partial<ConfigService> = {
  artradeApiBaseUrl: '',
  emailing: {
    apiKey: 'apiKeyMock',
  },
};

describe('EmailingService', () => {
  let service: EmailingService;
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [SilentLogger],
    }).compile();
    service = new EmailingService(
      testingModule.get(SilentLogger),
      configServiceMock as ConfigService,
      {} as any, // TODO mock EmailVerification once we implement tests that require it
    );
  });

  describe('sendInviteEmails', () => {
    it('should send emails to two recipents', async () => {
      jest.spyOn(service, 'postSmtpEmail' as any).mockResolvedValue({});

      await service.sendInviteEmails(['foo@domain.com', 'bar@domain.com'], 'john');

      expect((service as any).postSmtpEmail).toBeCalledWith(
        expect.objectContaining({
          sender: expect.objectContaining({
            email: expect.any(String),
            name: expect.any(String),
          }),
          subject: expect.any(String),
          htmlContent: expect.any(String),
          messageVersions: expect.arrayContaining([
            expect.objectContaining({
              to: expect.arrayContaining([
                { email: 'foo@domain.com', name: 'foo' },
                { email: 'bar@domain.com', name: 'bar' },
              ]),
            }),
          ]),
        }),
      );
    });
  });
});

import { mock, mockReset } from 'jest-mock-extended';
import { TokenPairOutputDto } from '../auth/dto/token.dto';
import { UserAuthService } from '../auth/user-auth.service';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../logging/logging.service';
import { mongoDocMock } from '../test/helpers/mongo-doc-mock';
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { GoogleUserInfo, GoogleUserInfoService } from './google-userinfo.service';
import { GoogleService } from './google.service';

describe('GoogleService', () => {
  let service: GoogleService;
  const userServiceMock = mock<UserService>();
  const userAuthServiceMock = mock<UserAuthService>();
  const googleUserInfoServiceMock = mock<GoogleUserInfoService>();

  beforeAll(async () => {
    service = new GoogleService(
      new SilentLogger(),
      userServiceMock,
      userAuthServiceMock,
      googleUserInfoServiceMock,
    );
  });

  beforeEach(() => {
    mockReset(userServiceMock);
    mockReset(userAuthServiceMock);
    mockReset(googleUserInfoServiceMock);
  });

  describe('loginGoogleUser', () => {
    const email = 'guillaume@artrade.app';

    const user = mongoDocMock<User>({
      email,
      nickname: 'skategui',
      lastName: 'Agis',
      firstName: 'Guillaume',
      password: 'my_password',
    } as User);

    const googleUserInfo: GoogleUserInfo = {
      email,
      nickname: user.email,
      lastName: user.lastName,
      firstName: user.firstName,
      picture: 'my_pic',
    };

    const token: TokenPairOutputDto = {
      authToken: {
        token: 'authToken',
        expiresAt: new Date(),
      },
      refreshToken: {
        token: 'refreshToken',
        expiresAt: new Date(),
      },
    };

    it('should return undefined if the token is not associated to any user', async () => {
      jest.spyOn(googleUserInfoServiceMock, 'getUserData').mockResolvedValue(undefined);
      expect(await service.loginGoogleUser('my_token')).toEqual(undefined);
    });
    it('should return undefined if google cannot get the user data', async () => {
      jest.spyOn(userServiceMock, 'getByEmail').mockResolvedValue(user);
      jest.spyOn(googleUserInfoServiceMock, 'getUserData').mockResolvedValue(undefined);
      expect(await service.loginGoogleUser('my_token')).toEqual(undefined);
    });
    it('should create user if user does not exist', async () => {
      jest.spyOn(userServiceMock, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(googleUserInfoServiceMock, 'getUserData').mockResolvedValue(googleUserInfo);
      jest.spyOn(userAuthServiceMock, 'signIn').mockResolvedValue(token);
      jest.spyOn(userServiceMock, 'createWithCompleteInfo').mockResolvedValue(user);

      expect(await service.loginGoogleUser('my_token')).toEqual(token);
      expect(userServiceMock.createWithCompleteInfo).toBeCalledWith(
        {
          email,
          nickname: googleUserInfo.nickname,
          lastName: googleUserInfo.lastName,
          firstName: googleUserInfo.firstName,
          password: expect.any(String),
        },
        expect.any(String),
        googleUserInfo.picture,
      );
      expect(userAuthServiceMock.signIn).toHaveBeenCalled();
    });
    it('should not create user and sign in if user already  exist', async () => {
      jest.spyOn(googleUserInfoServiceMock, 'getUserData').mockResolvedValue(googleUserInfo);
      jest.spyOn(userServiceMock, 'getByEmail').mockResolvedValue(user);
      jest.spyOn(userAuthServiceMock, 'signIn').mockResolvedValue(token);
      expect(await service.loginGoogleUser('my_token')).toEqual(token);
      expect(userServiceMock.createWithCompleteInfo).not.toHaveBeenCalled();
      expect(userAuthServiceMock.signIn).toHaveBeenCalled();
    });
  });
});

export class SilentLogger extends AppLogger {
  constructor() {
    super({ isDevelopment: false } as ConfigService);
  }
}

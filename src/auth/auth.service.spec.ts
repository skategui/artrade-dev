import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthenticationError } from 'apollo-server-express';
import { mock, mockReset } from 'jest-mock-extended';
import { JsonWebTokenError } from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';
import { AppLogger } from '../logging/logging.service';
import { mongoDocMock } from '../test/helpers/mongo-doc-mock';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { AuthService, UserAuthTrait } from './auth.service';
import { Role, TokenType } from './types';

const configServiceMock: Partial<ConfigService> = {
  jwt: {
    secret: 'foo',
    authExpire: '30d',
    refreshExpire: '30d',
  },
};

class ConcreteAuthService extends AuthService {
  constructor(userAuth: UserAuthTrait, jwtService: JwtService, logger: AppLogger) {
    super(userAuth, Role.User, logger, configServiceMock as ConfigService, jwtService);
  }
}

const tokenExpected = expect.objectContaining({
  token: expect.any(String),
  expiresAt: expect.any(Date),
});
const tokenPairExpected = expect.objectContaining({
  authToken: tokenExpected,
  refreshToken: tokenExpected,
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  const userAuth = mock<UserAuthTrait>();
  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'foo' })],
      providers: [SilentLogger],
    }).compile();
    jwtService = testingModule.get(JwtService);
    service = new ConcreteAuthService(userAuth, jwtService, testingModule.get(SilentLogger));
  });

  beforeEach(() => {
    mockReset(userAuth);
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      userAuth.tryLoginByEmailAndPassword.mockResolvedValue(
        mongoDocMock({ email: 'correctEmail@foo.com', password: 'hash' }),
      );
      expect(await service.signIn({ email: 'correctEmail@foo.com', password: 'foo' })).toEqual(
        tokenPairExpected,
      );
    });
    it('should fail to sign in', async () => {
      userAuth.tryLoginByEmailAndPassword.mockResolvedValue(null);
      await expect(
        service.signIn({ email: 'wrongEmail@foo.com', password: 'foo' }),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = jwtService.sign({ text: 'foo' });
      expect(service.verifyToken(token)).toMatchObject({ text: 'foo' });
    });
    it('should fail to verify invalid token', () => {
      expect(() => service.verifyToken('foo')).toThrowError(JsonWebTokenError);
    });
  });

  describe('refreshAuthToken', () => {
    it('should refreshAuthToken', async () => {
      const userPayload = {
        id: 'existingId',
        email: 'correctEmail@foo.com',
        password: 'hash',
      };
      const userDoc = mongoDocMock(userPayload);
      const refreshToken = jwtService.sign({ sub: userPayload.id, type: TokenType.Refresh });
      userAuth.getOne.mockResolvedValue(userDoc);
      const tokenPair = await service.refreshAuthToken(refreshToken);
      expect(tokenPair).toEqual(tokenPairExpected);
      expect(jwtService.verify(tokenPair.authToken.token)).toMatchObject({
        type: TokenType.Auth,
        sub: userPayload.id,
        role: Role.User,
      });
      expect(jwtService.verify(tokenPair.refreshToken.token)).toMatchObject({
        type: TokenType.Refresh,
        sub: userPayload.id,
        role: Role.User,
      });
      expect(userAuth.getOne).toBeCalled();
      expect(userAuth.updateJwtHash).toBeCalled();
    });
  });

  it('should fail refreshAuthToken if token is not a refresh token', async () => {
    const refreshToken = jwtService.sign({ sub: '123', type: TokenType.Auth });
    await expect(service.refreshAuthToken(refreshToken)).rejects.toThrowError(AuthenticationError);
  });

  it('should fail refreshAuthToken if user is not found', async () => {
    userAuth.getOne.mockResolvedValue(null);
    const refreshToken = jwtService.sign({ sub: 'dontExist', type: TokenType.Refresh });
    await expect(service.refreshAuthToken(refreshToken)).rejects.toThrowError(AuthenticationError);
  });
});

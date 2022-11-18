const env = process.env as any;

const setupMockEnv = () => {
  const value = 'jest-test-mockup-value';
  // We just need to please the ConfigService validation, but we wont use these.
  env.MONGO_URI = `mongodb://${value}`;
  env.S3_HOST = `https://${value}`;
  env.S3_BUCKET = value;
  env.S3_ACCESS_KEY_ID = value;
  env.S3_SECRET_ACCESS_KEY = value;
};

export default (): void => {
  setupMockEnv();
};

import { z } from 'zod';

export const googleConfigZod = {
  googleClientId: ['GOOGLE_CLIENT_ID', z.string()],
  googleSecret: ['GOOGLE_SECRET', z.string()],
  callbackURL: ['GOOGLE_CALLBACK_URL', z.string().url()],
} as const;

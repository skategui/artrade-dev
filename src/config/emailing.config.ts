import { z } from 'zod';

export const emailingConfigZod = {
  apiKey: ['SENDINBLUE_API_KEY', z.string().min(1)],
} as const;

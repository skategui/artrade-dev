import { z } from 'zod';

export const blockchainConfigZod = {
  apiKey: ['SOLANA_NETWORK', z.string()],
} as const;

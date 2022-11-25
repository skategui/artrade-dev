import { z } from 'zod';

export const elasticsearchConfigZod = {
  node: ['ELASTICSEARCH_NODE', z.string().min(1)],
  apiKey: [
    'ELASTICSEARCH_API_KEY',
    z
      .string()
      .optional()
      .transform((val) => val || undefined),
  ],
} as const;

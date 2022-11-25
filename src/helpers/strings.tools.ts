import { createHash } from 'crypto';
import { memoize } from 'lodash';
import { customAlphabet } from 'nanoid';

export const hash = (str: string): string => {
  return createHash('sha256').update(str).digest('hex');
};

const getShortIdGenerator = memoize((size: number) =>
  customAlphabet('123456789abcdefghijklmnopqrstuvwxyz', size),
);

export const createAlphanumericId = (size = 8): string => getShortIdGenerator(size)();

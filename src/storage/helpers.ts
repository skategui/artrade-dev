import { memoize } from 'lodash';
import moment from 'moment';
import { customAlphabet } from 'nanoid';

/* istanbul ignore next */
export function getSerializedTimestamp(date = new Date()): string {
  return moment(date).format('YYYY-MM-DD-hh-mm-ss');
}

/* istanbul ignore next */
const getShortIdGenerator = memoize((size: number) =>
  customAlphabet('123456789abcdefghijklmnopqrstuvwxyz', size),
);

/* istanbul ignore next */
export const createAlphanumericId = (size = 8): string => getShortIdGenerator(size)();

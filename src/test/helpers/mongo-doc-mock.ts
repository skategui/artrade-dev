import { nanoid } from 'nanoid';
import { DefaultModel } from '../../helpers/default.model';
import { PartialBy } from '../../types/type-operations';

type AutomaticFields = '_id' | 'createdAt' | 'updatedAt';

// Generate a random mock of a mongo doc
export const mongoDocMock = <T extends DefaultModel>(payload: PartialBy<T, AutomaticFields>): T => {
  const defaultCreatedAt = new Date();
  return {
    _id: nanoid(),
    createdAt: new Date(),
    updatedAt: payload.createdAt ?? defaultCreatedAt,
    ...payload,
  } as T;
};

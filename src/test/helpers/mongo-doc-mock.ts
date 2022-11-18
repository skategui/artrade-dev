import { nanoid } from 'nanoid';

// Generate a random mock of a mongo doc
export const mongoDocMock = <T extends object>(
  payload: T,
): T & { _id: string; createdAt: Date; updatedAt: Date } => {
  return {
    _id: nanoid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...payload,
  };
};

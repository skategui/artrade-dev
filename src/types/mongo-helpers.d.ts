export type CreatePayload<E> = Omit<E, '_id' | 'createdAt' | 'updatedAt'>;

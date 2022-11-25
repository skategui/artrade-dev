/**
 * Make some fields partial
 *
 * type User = {
 *   name: string,
 *   age: number,
 *   gender: Gender,
 * }
 *
 * PartialBy<User, 'age' | 'gender'> = {
 *   name: string,
 *   age?: number,
 *   gender?: Gender,
 * }
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

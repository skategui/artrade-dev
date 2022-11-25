/**
 * Allows to enforce the exact explicit type and reject excessive fields.
 *
 * @template T Type to enforce
 * @param value Value whose type to enforce
 * @returns The value.
 */
export const enforceType = <T>(value: T): T => value;

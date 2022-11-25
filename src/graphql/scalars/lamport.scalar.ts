import { GraphQLScalarType } from 'graphql';
import { Long } from 'mongodb';

const realisticLamportAmountRegex = /^\d{1,13}$/;

/* istanbul ignore next */
function validate(value: unknown): Long {
  try {
    if (typeof value !== 'string') {
      throw Error;
    }
    if (!realisticLamportAmountRegex.test(value)) {
      throw Error;
    }
    return new Long(value as any);
  } catch {
    throw Error(`Invalid lamport amount. Found ${value}`);
  }
}

export const GraphQlLamportScalar = new GraphQLScalarType({
  name: 'LamportAmount',
  description: 'An amount of Lamports',
  serialize: (value: Long) => value.toString(),
  parseValue: (value) => validate(value),
  parseLiteral: (ast) => validate((ast as any).value),
});

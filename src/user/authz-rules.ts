import { or, postExecRule } from '@graphql-authz/core';
import { z } from 'zod';
import { AuthZContext } from '../auth/authz/authz-rules';
import { getOptionalJwtPayloadFromAuthzContext } from '../auth/authz/helpers';
import { canReadAuthorizedDocuments } from '../auth/authz/rule-builders/can-read-authorized-documents';
import { User } from '../user/model/user.model';

const UserCanReadHisOwnFields = postExecRule({
  selectionSet: '{ _id }',
  error: 'Not enough permissions to read these user data',
})((context: AuthZContext, fieldArgs: unknown, user: User) => {
  if (!user) {
    return true;
  }
  z.string().parse(user?._id);
  const jwtPayload = getOptionalJwtPayloadFromAuthzContext(context);
  return jwtPayload?.sub === user._id;
});

const BaseUserDocProtectedFields = or(UserCanReadHisOwnFields, canReadAuthorizedDocuments);

export const userAuthZRules = {
  BaseUserDocProtectedFields,
} as const;

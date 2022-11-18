import { Request } from 'express';
import { userAuthZRules } from '../../user/authz-rules';

export interface AuthZContext {
  req: Request;
}

export const authZRules = {
  ...userAuthZRules,
} as const;

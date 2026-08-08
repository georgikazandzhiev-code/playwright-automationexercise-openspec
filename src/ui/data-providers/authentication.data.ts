import { WRONG_PASSWORD_PLACEHOLDER } from '@utils/constants';

export type UnknownCredentials = {
  email: string;
  password: string;
};

/**
 * Credentials for an account that does not exist (REQ-AUT-03).
 * Unique per call so a concurrent run cannot accidentally register this address
 * and turn a negative case green (constraint C1).
 */
export const buildUnknownCredentials = (): UnknownCredentials => ({
  email: `qa_unknown_${Date.now()}@mailinator.com`,
  password: WRONG_PASSWORD_PLACEHOLDER,
});

/**
 * A syntactically valid address that is never registered — for REQ-AUT-06, where the
 * request must be blocked by the browser before it reaches the site at all.
 */
export const buildSyntacticallyValidEmail = (): string =>
  `qa_probe_${Date.now()}@mailinator.com`;

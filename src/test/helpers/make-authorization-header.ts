export const makeAuthorizationHeader = (jwt: string): string => `Bearer ${jwt}`;

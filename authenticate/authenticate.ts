import totp from "./totp";
import {
  getAuthenticationSessionsBankId,
  getAuthenticationSessionsBankIdCollect,
  getAuthenticationSessionsBankIdCollectCustomer,
  getAuthenticationSessionsUsercredentials,
  getAuthenticationSessionsTotp,
  AuthenticationSessionsTotp
} from "../requests";

export interface Credentials {
  username?: string;
  password?: string;
  /**
   * Format 6 digit
   */
  totp?: string;
  /**
   * Format Sha1
   */
  totpSecret?: string;
  /**
   * Format XXXXXX-XXXX
   */
  personnummer?: string;
}

async function authenticateCredential(
  options: Credentials
): Promise<AuthenticationSessionsTotp> {
  const credential = await getAuthenticationSessionsUsercredentials(
    options.username,
    options.password
  );
  const totpCode = options.totpSecret ? totp(options.totpSecret) : options.totp;
  const session = await getAuthenticationSessionsTotp(
    totpCode,
    credential.twoFactorLogin.transactionId
  );
  return session;
}

async function authenticateBankId(options) {
  const attempt = await getAuthenticationSessionsBankId(options.personnummer);
  const success = await getAuthenticationSessionsBankIdCollect(
    attempt.transactionId,
    new Date(attempt.expires)
  );

  if (options.username) {
    const user = success.logins.find(
      login => login.username === options.username
    );
    if (user) {
      return await getAuthenticationSessionsBankIdCollectCustomer(
        user.loginPath
      );
    } else {
      throw "Username not found in login";
    }
  } else if (success.logins.length) {
    return await getAuthenticationSessionsBankIdCollectCustomer(
      success.logins[0].loginPath
    );
  } else {
    throw "No logins found";
  }
}

async function authenticate(
  options: Credentials
): Promise<AuthenticationSessionsTotp> {
  const useBankId = !!options.personnummer;

  if (useBankId) {
    return await authenticateBankId(options);
  }
  return await authenticateCredential(options);
}

export default authenticate;

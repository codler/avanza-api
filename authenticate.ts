import totp from "./totp";
import {
  getAuthenticationSessionsUsercredentials,
  getAuthenticationSessionsTotp,
  AuthenticationSessionsTotp
} from "./requests";

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

async function authenticate(
  options: Credentials
): Promise<AuthenticationSessionsTotp> {
  const useBankId = !!options.personnummer;

  if (useBankId) {
    throw "Implement bank id";
  }
  return await authenticateCredential(options);
}

export default authenticate;

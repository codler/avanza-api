const BASE_URL = "https://www.avanza.se/";

interface ResponseAuthenticationSessionsUsercredentials {
  twoFactorLogin: {
    method: string;
    transactionId: string;
  };
}
async function getAuthenticationSessionsUsercredentials(
  username,
  password
): Promise<ResponseAuthenticationSessionsUsercredentials> {
  const url = `${BASE_URL}_api/authentication/sessions/usercredentials`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  const responseJson: ResponseAuthenticationSessionsUsercredentials = await response.json();
  if (typeof responseJson.twoFactorLogin === "undefined") {
    console.error("Failed to authenticate", responseJson);
    throw "Failed to authenticate";
  }
  if (responseJson.twoFactorLogin.method !== "TOTP") {
    throw `Unsupported second factor method ${responseJson.twoFactorLogin.method}`;
  }
  return responseJson;
}

interface ResponseAuthenticationSessionsTotp {
  authenticationSession: string;
  customerId: string;
  pushSubscriptionId: string;
  registrationComplete: boolean;
}
export interface AuthenticationSessionsTotp
  extends ResponseAuthenticationSessionsTotp {
  securityToken: string;
}
async function getAuthenticationSessionsTotp(
  totpCode: string,
  twoFactorLoginTransactionId: string
): Promise<AuthenticationSessionsTotp> {
  const url = `${BASE_URL}_api/authentication/sessions/totp`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      method: "TOTP",
      totpCode
    }),
    headers: {
      "Content-Type": "application/json",
      Cookie: `AZAMFATRANSACTION=${twoFactorLoginTransactionId}`
    }
  });

  const securityToken = response.headers.get("x-securitytoken");
  if (!securityToken) {
    throw "Error getting security token";
  }
  const responseJson: ResponseAuthenticationSessionsTotp = await response.json();
  if (!responseJson.registrationComplete) {
    throw "Registration not complete";
  }
  if (
    responseJson.authenticationSession &&
    responseJson.pushSubscriptionId &&
    responseJson.customerId
  ) {
    return {
      ...responseJson,
      securityToken
    };
  } else {
    console.error(responseJson);
    throw "Json missing keys";
  }
}

export {
  getAuthenticationSessionsUsercredentials,
  getAuthenticationSessionsTotp
};

import Avanza from "./index";
interface ResponseAuthenticationSessionsBankId {
  transactionId: string;
  expires: string;
  autostartToken: string;
}

async function getAuthenticationSessionsBankId(
  personnummer
): Promise<ResponseAuthenticationSessionsBankId> {
  const url = `${Avanza.BASE_URL}/_api/authentication/sessions/bankid`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      identificationNumber: personnummer
    }),
    headers: {
      "Content-Type": "application/json"
    }
  });

  const responseJson: ResponseAuthenticationSessionsBankId = await response.json();
  if (typeof responseJson.transactionId === "undefined") {
    throw "Missing transactionId";
  }
  if (new Date(responseJson.expires) < new Date()) {
    throw "Authentication attempt expired";
  }
  return responseJson;
}

type ResponseAuthenticationSessionsBankIdCollectState = "OUTSTANDING_TRANSACTION";

interface ResponseAuthenticationSessionsBankIdCollectLoginAccount {
  accountName: string;
  accountType: string;
}
interface ResponseAuthenticationSessionsBankIdCollectLogin {
  customerId: string;
  username: string;
  accounts: ResponseAuthenticationSessionsBankIdCollectLoginAccount[];
  loginPath: string;
}
interface ResponseAuthenticationSessionsBankIdCollect {
  transactionId: string;
  state: ResponseAuthenticationSessionsBankIdCollectState;
  name?: string;
  logins: ResponseAuthenticationSessionsBankIdCollectLogin[];
  recommendedTargetCustomers: unknown[];
}

async function getAuthenticationSessionsBankIdCollect(
  transactionId,
  expires: Date
): Promise<ResponseAuthenticationSessionsBankIdCollect> {
  const url = `${Avanza.BASE_URL}/_api/authentication/sessions/bankid/collect`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Cookie: `AZAMFATRANSACTION=${transactionId}`
    }
  });

  const responseJson: ResponseAuthenticationSessionsBankIdCollect = await response.json();

  if (responseJson.state === "OUTSTANDING_TRANSACTION") {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (new Date(expires) < new Date()) {
          reject("Authentication attempt expired");
          return;
        }
        try {
          resolve(
            getAuthenticationSessionsBankIdCollect(
              responseJson.transactionId,
              expires
            )
          );
        } catch (e) {
          reject(e);
        }
      }, 2000);
    });
  } else if (responseJson.state === "COMPLETE") {
    return responseJson;
  } else {
    console.log(responseJson);
    throw "Unknown state";
  }
}

async function getAuthenticationSessionsBankIdCollectCustomer(
  loginPath: string
): Promise<AuthenticationSessionsTotp> {
  const url = Avanza.BASE_URL + loginPath;
  const response = await fetch(url);

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
  const url = `${Avanza.BASE_URL}/_api/authentication/sessions/usercredentials`;
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
    console.error(
      "Request usercredentials: Failed to authenticate",
      responseJson
    );
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
  const url = `${Avanza.BASE_URL}/_api/authentication/sessions/totp`;
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

  if (response.status === 401) {
    throw new Error("Unauthorized Totp");
  }

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
  getAuthenticationSessionsBankId,
  getAuthenticationSessionsBankIdCollect,
  getAuthenticationSessionsBankIdCollectCustomer,
  getAuthenticationSessionsUsercredentials,
  getAuthenticationSessionsTotp
};

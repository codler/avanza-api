import "fetch-register";
import authenticate, { Credentials } from "./authenticate/authenticate";
import { AuthenticationSessionsTotp } from "./requests";

enum AccountType {
  "AktieFondkonto",
  "Investeringssparkonto",
  "KreditkontoISK",
  "SparkontoPlus"
}

type SparkontoPlusType = "Collector" | "Klarna" | "Santander" | string;

interface Account {
  accountType: AccountType;
  interestRate: number;
  depositable: boolean;
  name: string;
  active: boolean;
  totalProfit: number;
  accountId: string;
  tradable: boolean;
  totalBalance: number;
  totalBalanceDue: number;
  ownCapital: number;
  accountPartlyOwned: boolean;
  buyingPower: number;
  totalProfitPercent: number;
  performance: number;
  performancePercent: number;
  sparkontoPlusType?: SparkontoPlusType;
  attorney: boolean;
}

interface ResponseOverview {
  accounts: Account[];
  numberOfOrders: number;
  numberOfDeals: number;
  totalBuyingPower: number;
  totalOwnCapital: number;
  totalBalance: number;
  numberOfTransfers: number;
  numberOfIntradayTransfers: number;
  totalPerformancePercent: number;
  totalPerformance: number;
}

class Avanza {
  static BASE_URL = "https://www.avanza.se/";

  public get isAuthenticated(): boolean {
    return (
      this.session &&
      !!this.session.securityToken &&
      !!this.session.authenticationSession
    );
  }

  session: AuthenticationSessionsTotp;

  async authenticate(options: Credentials): Promise<boolean> {
    this.session = await authenticate(options);
    return this.isAuthenticated;
  }

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.isAuthenticated) {
      throw "Call authenticate before";
    }

    const requestPath = Avanza.BASE_URL + path;
    const requestOptions: RequestInit = Object.assign({}, options, {
      headers: {
        ...options.headers,
        "X-AuthenticationSession": this.session.authenticationSession,
        "X-SecurityToken": this.session.securityToken
      }
    });

    const response = await fetch(requestPath, requestOptions);
    return response.json();
  }

  async getAccounts(): Promise<Account[]> {
    const overview: ResponseOverview = await this.getAccountsSummary();
    return overview.accounts;
  }

  getAccountsSummary(): Promise<ResponseOverview> {
    return this.fetch("_mobile/account/overview");
  }
}

export default Avanza;

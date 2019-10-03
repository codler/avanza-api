import "fetch-register";
import authenticate, { Credentials } from "./authenticate/authenticate";
import { AuthenticationSessionsTotp } from "./requests";

enum AccountType {
  "AktieFondkonto",
  "Investeringssparkonto",
  "KreditkontoISK",
  "SparkontoPlus",
  "Tjanstepension"
}

enum InstrumentType {
  "STOCK",
  "FUND",
  "CERTIFICATE",
  "UNKNOWN"
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

interface Position {
  instrumentType: InstrumentType; // Internal
  accountName: string;
  accountType: AccountType;
  depositable: boolean;
  accountId: string;
  changePercentPeriod?: number; // Fund
  changePercentThreeMonths?: number; // Fund
  value: number;
  profit: number;
  volume: number;
  collateralValue?: number;
  averageAcquiredPrice: number;
  profitPercent: number;
  acquiredValue: number;
  name: string;
  currency: string;
  flagCode?: string; // Not in Fund
  orderbookId?: string; // Not in Unknown
  tradable?: boolean; // Not in Unknown
  lastPrice?: number; // Not in Unknown
  lastPriceUpdated?: string; // Not in Unknown
  change?: number; // Not in Unknown
  changePercent?: number; // Not in Unknown
}

interface InstrumentPosition {
  instrumentType: InstrumentType;
  positions: Position[];
  totalValue: number;
  todaysProfitPercent: number;
  totalProfitValue: number;
  totalProfitPercent: number;
}
interface ResponsePositions {
  instrumentPositions: InstrumentPosition[];
  totalOwnCapital: number;
  totalBuyingPower: number;
  totalBalance: number;
  totalProfitPercent: number;
  totalProfit: number;
}

class Avanza {
  static BASE_URL = "https://www.avanza.se";

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

  async getPositions(): Promise<Position[]> {
    const responsePositions: ResponsePositions = await this.getPositionsByInstrumentType();

    const positions: Position[] = [];

    responsePositions.instrumentPositions.forEach(instrumentPosition =>
      instrumentPosition.positions.forEach(position => {
        position.instrumentType = instrumentPosition.instrumentType;
        positions.push(position);
      })
    );

    return positions;
  }

  getPositionsByInstrumentType(): Promise<ResponsePositions> {
    return this.fetch("/_mobile/account/positions");
  }

  getAccountsSummary(): Promise<ResponseOverview> {
    return this.fetch("/_mobile/account/overview");
  }
}

export default Avanza;

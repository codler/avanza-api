import "fetch-register";
import { exit } from "process";
import authenticate, { Credentials } from "./authenticate/authenticate";
import { AuthenticationSessionsTotp } from "./requests";

enum AccountType {
  "AktieFondkonto" = "AktieFondkonto",
  "Investeringssparkonto" = "Investeringssparkonto",
  "KreditkontoISK" = "KreditkontoISK",
  "SparkontoPlus" = "SparkontoPlus",
  "Tjanstepension" = "Tjanstepension"
}

export enum InstrumentType {
  "STOCK" = "STOCK",
  "FUND" = "FUND",
  "CERTIFICATE" = "CERTIFICATE",
  "UNKNOWN" = "UNKNOWN"
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

interface TransactionFees {
  commission: number;
  marketFees: number;
  totalFees: number;
  totalSum: number;
  totalSumWithoutFees: number;
}

interface Orderbook {
  currency: string;
  flagCode: string;
  name: string;
  id: string;
  type: InstrumentType; // InstrumentType??
  marketPlace: string; // eg Stockholmsbörsen
}
interface Order {
  transactionFees: TransactionFees;
  orderbook: Orderbook;
  account: { type: string; name: string; id: string };
  status: string; // eg Marknaden
  statusDescription: string;
  rawStatus: string; // eg ACTIVE
  validUntil: string;
  openVolume: unknown;
  marketTransaction: boolean;
  type: string; // eg BUY
  orderId: string;
  deletable: boolean;
  price: number;
  modifyAllowed: boolean;
  orderDateTime: string;
  volume: number;
  sum: number;
}

interface ResponseDealsAndOrders {
  orders: Order[];
  deals: unknown[];
  accounts: { type: string; name: string; id: string }[];
  reservedAmount: number;
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

  credentials: Credentials;
  session: AuthenticationSessionsTotp;

  expireSession() {
    this.session = undefined;
  }

  retryAuthenticate(): Promise<boolean> {
    console.log("retryAuthenticate");
    this.expireSession();
    return this.authenticate(this.credentials);
  }

  async authenticate(options: Credentials): Promise<boolean> {
    if (!options) {
      throw "Missing credentials";
    }
    this.credentials = options;
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

    try {
      const response = await fetch(requestPath, requestOptions);

      if (response.status === 401) {
        await this.retryAuthenticate();
        if (this.isAuthenticated) {
          return this.fetch(path, options);
        }
        throw { code: 401 };
      } else {
        return response.json().catch(e => {
          console.log(response);
          throw e;
        });
      }
    } catch (e) {
      if (e) {
        if (e.code === "ENOTFOUND") {
          console.log("Fetch: ENOTFOUND");
          throw e;
        }
        if (e.code === 401) {
          console.log("Fetch: 401");
          throw e;
        }
      }
      console.log(e);
      exit(1);
    }
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

  async getOrders(): Promise<Order[]> {
    const dealsandorders: ResponseDealsAndOrders = await this.getDealsAndOrders();
    return dealsandorders.orders;
  }

  getDealsAndOrders(): Promise<ResponseDealsAndOrders> {
    return this.fetch("/_mobile/account/dealsandorders");
  }

  getOrderbooks(orderbookIds: string[]) {
    if (!orderbookIds || orderbookIds.length === 0) {
      throw "Missing orderbookIds";
    }
    const path = orderbookIds.join(",");
    return this.fetch("/_mobile/market/orderbooklist/" + path);
  }
}

export default Avanza;

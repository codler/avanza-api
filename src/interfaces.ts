export enum AccountType {
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

export type SparkontoPlusType = "Collector" | "Klarna" | "Santander" | string;

export interface Account {
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

export interface ResponseOverview {
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

export interface Position {
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

export interface InstrumentPosition {
  instrumentType: InstrumentType;
  positions: Position[];
  totalValue: number;
  todaysProfitPercent: number;
  totalProfitValue: number;
  totalProfitPercent: number;
}
export interface ResponsePositions {
  instrumentPositions: InstrumentPosition[];
  totalOwnCapital: number;
  totalBuyingPower: number;
  totalBalance: number;
  totalProfitPercent: number;
  totalProfit: number;
}

export interface TransactionFees {
  commission: number;
  marketFees: number;
  totalFees: number;
  totalSum: number;
  totalSumWithoutFees: number;
}

export interface Orderbook {
  currency: string;
  flagCode: string;
  name: string;
  id: string;
  type: InstrumentType; // InstrumentType??
  marketPlace: string; // eg Stockholmsbörsen
}
export interface Order {
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

export interface ResponseDealsAndOrders {
  orders: Order[];
  deals: unknown[];
  accounts: { type: string; name: string; id: string }[];
  reservedAmount: number;
}

export interface ResponseOrderbook {
  currency: string;
  highestPrice?: number; // STOCK
  lowestPrice?: number; // STOCK
  lastPrice?: number; // STOCK
  change?: number; // STOCK
  changePercent?: number; // STOCK
  updated?: string; // STOCK
  totalVolumeTraded?: number; // STOCK
  flagCode?: string; // STOCK
  priceThreeMonthsAgo?: number; // STOCK
  managementFee?: number; // FUND
  prospectus?: string; // FUND
  rating?: number; // FUND
  changePercentOneYear?: number; // FUND
  minMonthlySavingAmount?: number; // FUND
  risk?: number; // FUND
  lastUpdated?: string; // FUND
  changePercentPeriod?: number; // FUND
  changePercentThreeMonths?: number; // FUND
  instrumentType: InstrumentType;
  tradable: boolean;
  name: string;
  id: string;
}

export interface Search {
  instrumentType: InstrumentType; // Internal
  currency: string;
  lastPrice: number;
  changePercent: number;
  tradable: boolean;
  tickerSymbol: string;
  flagCode: string;
  name: string;
  id: string;
}

export interface ResponseSearchHit {
  instrumentType: InstrumentType;
  numberOfHits: number;
  topHits: Search[];
}
export interface ResponseSearch {
  totalNumberOfHits: number;
  hits: ResponseSearchHit[];
}

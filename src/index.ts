import "fetch-register";
import authenticate, { Credentials } from "./authenticate";
import { AuthenticationSessionsTotp } from "./requests";
import * as I from "./interfaces";
import { InstrumentType } from "./interfaces";
import { process } from "./utils";

interface PreFetch {
  (path: string, options: RequestInit): { [0]: string; [1]: RequestInit };
}
class Avanza {
  static BASE_URL = "https://www.avanza.se";

  private preFetch: PreFetch;

  constructor(options: { preFetch?: PreFetch } = {}) {
    this.preFetch =
      options.preFetch ||
      function(...rest) {
        return rest;
      };
  }

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

  async authFetch(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.isAuthenticated) {
      throw "Call authenticate before";
    }
    return this.fetch(path, options);
  }

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const requestPath = Avanza.BASE_URL + path;
    const requestOptions: RequestInit = Object.assign({}, options, {
      headers: {
        ...options.headers,
        "X-AuthenticationSession":
          this.session && this.session.authenticationSession,
        "X-SecurityToken": this.session && this.session.securityToken
      }
    });

    try {
      const response = await fetch.apply(
        this,
        this.preFetch(requestPath, requestOptions)
      );

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
        if (e.code === "ETIMEDOUT") {
          console.log("Fetch: ETIMEDOUT");
          throw e;
        }
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
      process.exit(1);
    }
  }

  async getAccounts(): Promise<I.Account[]> {
    const overview: I.ResponseOverview = await this.getAccountsSummary();
    return overview.accounts;
  }

  async getPositions(): Promise<I.Position[]> {
    const responsePositions: I.ResponsePositions = await this.getPositionsByInstrumentType();

    const positions: I.Position[] = [];

    responsePositions.instrumentPositions.forEach(instrumentPosition =>
      instrumentPosition.positions.forEach(position => {
        position.instrumentType = instrumentPosition.instrumentType;
        positions.push(position);
      })
    );

    return positions;
  }

  getPositionsByInstrumentType(): Promise<I.ResponsePositions> {
    return this.authFetch("/_mobile/account/positions");
  }

  getAccountsSummary(): Promise<I.ResponseOverview> {
    return this.authFetch("/_mobile/account/overview");
  }

  async getOrders(): Promise<I.Order[]> {
    const dealsandorders: I.ResponseDealsAndOrders = await this.getDealsAndOrders();
    return dealsandorders.orders;
  }

  getDealsAndOrders(): Promise<I.ResponseDealsAndOrders> {
    return this.authFetch("/_mobile/account/dealsandorders");
  }

  getOrderbooks(orderbookIds: string[]): Promise<I.ResponseOrderbook[]> {
    if (!orderbookIds || orderbookIds.length === 0) {
      throw "Missing orderbookIds";
    }
    const path = orderbookIds.join(",");
    return this.authFetch("/_mobile/market/orderbooklist/" + path);
  }

  async searchList(
    query: string,
    instrumentType: InstrumentType = InstrumentType.STOCK
  ): Promise<I.Search[]> {
    const responseSearch: I.ResponseSearch = await this.search(
      query,
      instrumentType
    );

    const search: I.Search[] = [];

    responseSearch.hits.forEach(hit =>
      hit.topHits.forEach(topHit => {
        topHit.instrumentType = hit.instrumentType;
        search.push(topHit);
      })
    );

    return search;
  }

  search(
    query: string,
    instrumentType: InstrumentType = InstrumentType.STOCK
  ): Promise<I.ResponseSearch> {
    const qs = {
      limit: "1000",
      query: query
    };
    return this.fetch(
      "/_mobile/market/search/" + instrumentType + "?" + new URLSearchParams(qs)
    );
  }
}

export * from "./interfaces";
export default Avanza;

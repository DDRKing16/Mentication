import { beforeEach, describe, expect, it, vi } from "vitest";

class LocalStorageStub {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

async function freshModule() {
  vi.resetModules();
  return import("./subscription.js");
}

const future = new Date(Date.now() + 30 * 864e5).toISOString();
const past = new Date(Date.now() - 864e5).toISOString();

beforeEach(() => { global.localStorage = new LocalStorageStub(); });

describe("Mentication Plus", () => {
  it("starts locked for someone who has never subscribed", async () => {
    const plus = await freshModule();
    expect(plus.isPlusActive()).toBe(false);
  });

  it("remembers an active subscription offline", async () => {
    localStorage.setItem("mentication.plus.v1", JSON.stringify({ active: true, productId: "com.mentation.app.plus.annual", expiresAt: future }));
    const plus = await freshModule();
    expect(plus.isPlusActive()).toBe(true);
  });

  it("does not keep Plus open past a remembered expiry date", async () => {
    localStorage.setItem("mentication.plus.v1", JSON.stringify({ active: true, productId: "com.mentation.app.plus.monthly", expiresAt: past }));
    const plus = await freshModule();
    expect(plus.isPlusActive()).toBe(false);
  });

  it("survives a corrupted saved value by treating it as locked", async () => {
    localStorage.setItem("mentication.plus.v1", "{not json");
    const plus = await freshModule();
    expect(plus.isPlusActive()).toBe(false);
  });

  it("only counts current, un-refunded Plus purchases", async () => {
    const { isLivePlusPurchase, PLUS_PRODUCTS } = await freshModule();
    const base = { productIdentifier: PLUS_PRODUCTS.monthly, expirationDate: future };
    expect(isLivePlusPurchase(base)).toBe(true);
    expect(isLivePlusPurchase({ ...base, productIdentifier: "com.other.app.thing" })).toBe(false);
    expect(isLivePlusPurchase({ ...base, expirationDate: past })).toBe(false);
    expect(isLivePlusPurchase({ ...base, revocationDate: past })).toBe(false);
    expect(isLivePlusPurchase({ ...base, subscriptionState: "expired" })).toBe(false);
    expect(isLivePlusPurchase({ ...base, isActive: false })).toBe(false);
    expect(isLivePlusPurchase({ ...base, subscriptionState: "inGracePeriod" })).toBe(true);
  });

  it("offers a clearly marked test purchase only in development, outside the app", async () => {
    const plus = await freshModule();
    const result = await plus.purchasePlus();
    expect(result).toMatchObject({ active: true, test: true });
    plus.clearTestPlus();
    expect(plus.isPlusActive()).toBe(false);
  });

  it("in the browser, shows the placeholder prices (there is no App Store here)", async () => {
    const plus = await freshModule();
    expect(await plus.loadPlusPrices()).toEqual(plus.FALLBACK_PRICES);
  });

  it("on the phone, never claims a specific price it couldn't confirm from Apple", async () => {
    vi.doMock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
    vi.doMock("@capgo/native-purchases", () => ({
      NativePurchases: { getProducts: () => { throw new Error("offline"); } },
      PURCHASE_TYPE: { SUBS: "subs" },
    }));
    const plus = await freshModule();
    // A wrong-currency guess (the fallback text is US dollars) would mislead
    // anyone not on the US store, so a failed fetch must come back as null,
    // never as FALLBACK_PRICES.
    expect(await plus.loadPlusPrices()).toEqual({ monthly: null });
  });
});

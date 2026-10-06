// Mentication Plus — the subscription.
//
// Purchases go straight to Apple (StoreKit) through @capgo/native-purchases.
// There is no server of ours in the middle: Apple holds the subscription, and
// this file only asks Apple "is this person subscribed?" and remembers the
// answer on the device so Plus keeps working offline.
//
// In the browser (development and the preview), there is no App Store, so a
// clearly-labelled test purchase is available in development builds only.
import { useSyncExternalStore } from "react";
import { hasJourneyAccess } from "./accessPolicy";
import { Capacitor } from "@capacitor/core";

// Must match the product ID created in App Store Connect exactly. There is
// one plan: a single monthly subscription. The 7-day free trial is Apple's
// introductory offer on that product, configured in App Store Connect.
export const PLUS_PRODUCTS = Object.freeze({
  monthly: "com.mentation.app.plus.monthly",
});
const PRODUCT_IDS = Object.values(PLUS_PRODUCTS);

// Length of the free trial configured on the product in App Store Connect.
// Shown on the Plus screen; keep it in step with what is set up there.
export const PLUS_TRIAL_DAYS = 7;

// Shown until the App Store has returned real, local prices. The baseline
// price point is US$7.99/month — Apple converts it to each store's local
// currency, so this is only ever a placeholder in the browser.
export const FALLBACK_PRICES = Object.freeze({
  monthly: "US$7.99/month",
});

const CACHE_KEY = "mentication.plus.v1";
const isNative = () => Capacitor.isNativePlatform();
const isDev = () => Boolean(import.meta.env?.DEV);

// Explicit nonproduction build opt-in, restricted to the founder preview.
// Never persists an entitlement or changes Apple subscription state.
export const founderPreview = import.meta.env.VITE_FOUNDER_PREVIEW === "1"
  && !isNative()
  && typeof window !== "undefined"
  && window.location.hostname === "mentication-chatgpt-preview.onrender.com";

let listeners = new Set();
let snapshot = readCache();

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!raw || typeof raw !== "object") return { active: false };
    const expired = raw.expiresAt && Date.parse(raw.expiresAt) < Date.now();
    return { active: Boolean(raw.active) && !expired, productId: raw.productId || null, expiresAt: raw.expiresAt || null, test: Boolean(raw.test) };
  } catch {
    return { active: false };
  }
}

function writeCache(next) {
  snapshot = { active: Boolean(next.active), productId: next.productId || null, expiresAt: next.expiresAt || null, test: Boolean(next.test) };
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...snapshot, checkedAt: new Date().toISOString() })); } catch { /* storage full or blocked: keep the in-memory answer */ }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current Plus state: { active, productId, expiresAt, test }. */
export function getPlus() {
  return snapshot;
}

export function isPlusActive() {
  return snapshot.active;
}

/** React hook: re-renders when Plus starts or ends. */
export function usePlus() {
  const state = useSyncExternalStore(subscribe, getPlus, getPlus);
  return { ...state, founderPreview, hasAccess: hasJourneyAccess({ active: state.active, founderPreview }) };
}

async function plugin() {
  const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
  return { NativePurchases, SUBS: PURCHASE_TYPE.SUBS };
}

/** Is this App Store purchase a current, un-refunded Plus subscription? */
export function isLivePlusPurchase(purchase) {
  if (!PRODUCT_IDS.includes(purchase.productIdentifier)) return false;
  if (purchase.revocationDate) return false;
  if (purchase.subscriptionState && ["expired", "revoked"].includes(purchase.subscriptionState)) return false;
  if (purchase.isActive === false) return false;
  if (purchase.expirationDate && Date.parse(purchase.expirationDate) < Date.now()) return false;
  return true;
}

/** Ask Apple whether this person is subscribed, and remember the answer. */
export async function refreshPlus() {
  if (!isNative()) return snapshot; // the browser has no App Store; keep what we have
  try {
    const { NativePurchases, SUBS } = await plugin();
    const { purchases } = await NativePurchases.getPurchases({ productType: SUBS, onlyCurrentEntitlements: true });
    const live = (purchases || []).filter(isLivePlusPurchase).sort((a, b) => Date.parse(b.expirationDate || 0) - Date.parse(a.expirationDate || 0))[0];
    writeCache(live ? { active: true, productId: live.productIdentifier, expiresAt: live.expirationDate || null } : { active: false });
  } catch {
    // Offline or StoreKit unavailable: keep the last known answer rather than
    // locking someone out of what they've paid for.
  }
  return snapshot;
}

/**
 * Real, local prices from the App Store: { monthly } price strings.
 * On the phone, a price that couldn't be confirmed comes back as `null`
 * rather than the placeholder text below — showing e.g. "A$59.99" as if
 * final would be the wrong currency for anyone not on the Australian store.
 * The caller decides what to say instead (see Plus.jsx).
 */
export async function loadPlusPrices() {
  if (!isNative()) return { ...FALLBACK_PRICES };
  try {
    const { NativePurchases, SUBS } = await plugin();
    const { products } = await NativePurchases.getProducts({ productIdentifiers: PRODUCT_IDS, productType: SUBS });
    const price = (id, suffix) => {
      const product = (products || []).find((p) => p.identifier === id);
      return product ? `${product.priceString}${suffix}` : null;
    };
    return { monthly: price(PLUS_PRODUCTS.monthly, "/month") };
  } catch {
    return { monthly: null };
  }
}

/** Start the App Store purchase for the monthly plan. */
export async function purchasePlus(plan = "monthly") {
  const productId = PLUS_PRODUCTS[plan];
  if (!productId) throw new Error("Unknown plan.");
  if (!isNative()) {
    if (isDev()) {
      // Development/preview only: a clearly-marked test purchase so the flow can be tried.
      writeCache({ active: true, productId, expiresAt: null, test: true });
      return snapshot;
    }
    throw new Error("Subscriptions are available in the Mentication iPhone app.");
  }
  const { NativePurchases, SUBS } = await plugin();
  await NativePurchases.purchaseProduct({ productIdentifier: productId, productType: SUBS });
  return refreshPlus();
}

/** Bring back a subscription bought on another device or before a reinstall. */
export async function restorePlus() {
  if (!isNative()) return snapshot;
  const { NativePurchases } = await plugin();
  await NativePurchases.restorePurchases();
  return refreshPlus();
}

/** Open Apple's own subscription management screen. */
export async function managePlus() {
  if (!isNative()) return;
  const { NativePurchases } = await plugin();
  await NativePurchases.manageSubscriptions();
}

/** Development only: end a test purchase. */
export function clearTestPlus() {
  if (snapshot.test) writeCache({ active: false });
}

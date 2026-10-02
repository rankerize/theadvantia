// Debug avanzado de firma — prueba con valores URL-encoded en el string firmado
import crypto from "crypto";

const USER_ID = process.env.FALA_USER_ID!;
const API_KEY  = process.env.FALA_API_KEY!;
const BASE_URL = "https://sellercenter-api.falabella.com/";
const ts       = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");

function hmac(str: string): string {
  return crypto.createHmac("sha256", API_KEY).update(str).digest("hex");
}

async function tryVariant(label: string, signStr: string, queryParams: Record<string, string>) {
  const sig = hmac(signStr);
  const all = { ...queryParams, Signature: sig };
  const qs  = Object.keys(all).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(all[k])}`)
    .join("&");
  const url = `${BASE_URL}?${qs}`;
  const res  = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await res.text();
  const ok   = !body.includes("Signature mismatch") && !body.includes("Login failed");
  console.log(`[${ok ? "✅ OK" : "❌"}] ${label}`);
  if (ok) {
    console.log("   RESPUESTA:", body.slice(0, 400));
    console.log("   URL:", url);
  }
}

const baseParams = { Action: "GetProducts", Format: "JSON", Timestamp: ts, UserID: USER_ID, Version: "1.0" };

// Variante 1: firma con valores raw (lo que hacíamos)
await tryVariant(
  "raw — Action=...&UserID=email@...",
  Object.keys(baseParams).sort().map(k => `${k}=${(baseParams as any)[k]}`).join("&"),
  baseParams
);

// Variante 2: firma con valores URL-encoded (como aparecen en la URL)
const encodedParams: Record<string, string> = {};
for (const [k, v] of Object.entries(baseParams)) encodedParams[k] = encodeURIComponent(v);
await tryVariant(
  "url-encoded — UserID=mariaclara59%40gmail.com",
  Object.keys(encodedParams).sort().map(k => `${k}=${encodedParams[k]}`).join("&"),
  baseParams
);

// Variante 3: firma solo con la base URL + params (estilo Lazada)
await tryVariant(
  "con base path — /api?Action=...&UserID=...",
  `/${Object.keys(baseParams).sort().map(k => `${k}=${(baseParams as any)[k]}`).join("&")}`,
  baseParams
);

// Variante 4: UPPERCASE hex
const sig4 = hmac(Object.keys(baseParams).sort().map(k => `${k}=${(baseParams as any)[k]}`).join("&")).toUpperCase();
const all4  = { ...baseParams, Signature: sig4 };
const qs4   = Object.keys(all4).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent((all4 as any)[k])}`).join("&");
const url4  = `${BASE_URL}?${qs4}`;
const res4  = await fetch(url4, { headers: { Accept: "application/json" } });
const body4 = await res4.text();
const ok4   = !body4.includes("Signature mismatch") && !body4.includes("Login failed");
console.log(`[${ok4 ? "✅ OK" : "❌"}] UPPERCASE hex`);

// Variante 5: sin separador &, concatenación directa
await tryVariant(
  "sin & — Action=GetProductsFormat=JSONTimestamp=...",
  Object.keys(baseParams).sort().map(k => `${k}=${(baseParams as any)[k]}`).join(""),
  baseParams
);

// Variante 6: con OperatorCode=FACO (Colombia)
const withOp = { ...baseParams, OperatorCode: "FACO" };
await tryVariant(
  "con OperatorCode=FACO",
  Object.keys(withOp).sort().map(k => `${k}=${(withOp as any)[k]}`).join("&"),
  withOp
);

// Variante 7: timestamp sin +00:00 (epoch unix como string)
const epoch = String(Math.floor(Date.now() / 1000));
const withEpoch = { ...baseParams, Timestamp: epoch };
await tryVariant(
  "timestamp como unix epoch",
  Object.keys(withEpoch).sort().map(k => `${k}=${(withEpoch as any)[k]}`).join("&"),
  withEpoch
);

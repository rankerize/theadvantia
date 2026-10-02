import crypto from "crypto";

// Falabella Seller Center API — Colombia (heredado de Linio)
// Docs: https://developers.falabella.com/docs/getting-started
// Base URL Colombia: https://sellercenter-api.linio.com.co/
// Auth: HMAC-SHA256 por cada request

const BASE_URL = "https://sellercenter-api.falabella.com/";
const VERSION = "1.0";
const FORMAT = "JSON";

// Credenciales por tenant (seller). Obtener desde Seller Center → Integraciones → API
export interface FalabellaCredentials {
  userId: string;   // email del seller
  apiKey: string;   // clave secreta del seller
}

// --- Firma HMAC-SHA256 -------------------------------------------------------

// Falabella espera ISO 8601 sin milisegundos y con offset +00:00 (no "Z")
function isoTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function buildUrl(
  action: string,
  creds: FalabellaCredentials,
  extra: Record<string, string> = {}
): string {
  const base: Record<string, string> = {
    Action: action,
    Format: FORMAT,
    Timestamp: isoTimestamp(),
    UserID: creds.userId,
    Version: VERSION,
    ...extra,
  };
  // Falabella firma los valores ya URL-encoded (ej: @ → %40, : → %3A)
  const signStr = Object.keys(base)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(base[k])}`)
    .join("&");
  const signature = crypto
    .createHmac("sha256", creds.apiKey)
    .update(signStr)
    .digest("hex");
  const qs = `${signStr}&Signature=${signature}`;
  return `${BASE_URL}?${qs}`;
}

async function call<T>(
  action: string,
  creds: FalabellaCredentials,
  extra: Record<string, string> = {}
): Promise<T> {
  const url = buildUrl(action, creds, extra);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Falabella SC ${action} HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { SuccessResponse?: { Body: T }; ErrorResponse?: { Head: { ErrorMessage: string } } };
  if (json.ErrorResponse) throw new Error(`Falabella SC error: ${json.ErrorResponse.Head.ErrorMessage}`);
  return json.SuccessResponse!.Body;
}

async function callPost<T>(
  action: string,
  creds: FalabellaCredentials,
  xmlBody: string
): Promise<T> {
  const url = buildUrl(action, creds);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/xml; charset=utf-8", Accept: "application/json" },
    body: xmlBody,
  });
  if (!res.ok) throw new Error(`Falabella SC ${action} POST HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { SuccessResponse?: { Body: T }; ErrorResponse?: { Head: { ErrorMessage: string } } };
  if (json.ErrorResponse) throw new Error(`Falabella SC error: ${json.ErrorResponse.Head.ErrorMessage}`);
  return json.SuccessResponse!.Body;
}

// --- Tipos de respuesta ------------------------------------------------------

export interface FalabellaProduct {
  SellerSku: string;
  ShopSku: string;
  Name: string;
  Description: string;
  PrimaryCategory: string;
  Categories: string;
  Price: string;
  SalePrice: string;
  Status: string;
  Quantity: number;
  ContentScore: number;
  QCStatus: string;
  isPublished: number;
  Url: string;
  MainImage: string;
}

export interface FalabellaCategory {
  CategoryId: string;
  Name: string;
  GlobalIdentifier: string;
  AttributeSetName?: string;
  Children?: FalabellaCategory[];
}

export interface FalabellaCategoryAttribute {
  Label: string;
  Name: string;
  FeedName: string;
  GlobalIdentifier: string;
  IsMandatory: number;    // 1 = requerido
  IsGlobalAttribute: number;
  Description: string;
  ProductType: string;
  InputType: string;
  AttributeType: string;
  ExampleValue: string;
  MaxLength: string;
  Options?: Array<{ GlobalIdentifier: string; Name: string }>;
}

export interface FalabellaOrder {
  OrderId: string;
  OrderNumber: string;
  CustomerFirstName: string;
  PaymentMethod: string;
  GrandTotal: string;
  TaxAmount: string;
  ItemsCount: string;
  CreatedAt: string;
  UpdatedAt: string;
  Status: string;
}

export interface FalabellaContentScore {
  SellerSku: string;
  ContentScore: number;
  Attributes: Array<{
    Attribute: string;
    Score: number;
    MaxScore: number;
  }>;
}

// --- Catálogo ----------------------------------------------------------------

export async function getProducts(
  creds: FalabellaCredentials,
  options: { offset?: number; limit?: number; filter?: "all" | "active" | "inactive" } = {}
): Promise<FalabellaProduct[]> {
  const extra: Record<string, string> = {
    Offset: String(options.offset ?? 0),
    Limit: String(options.limit ?? 100),
  };
  if (options.filter && options.filter !== "all") extra["Filter"] = options.filter;
  const body = await call<{ Products: { Product: FalabellaProduct | FalabellaProduct[] } }>(
    "GetProducts",
    creds,
    extra
  );
  const raw = body.Products.Product;
  return Array.isArray(raw) ? raw : [raw];
}

export async function getContentScore(
  creds: FalabellaCredentials,
  sellerSkus: string[]
): Promise<FalabellaContentScore[]> {
  const body = await call<{ Products: { Product: FalabellaContentScore[] } }>(
    "GetContentScore",
    creds,
    { SellerSkuList: sellerSkus.join(",") }
  );
  return body.Products.Product;
}

// --- Categorías y atributos --------------------------------------------------

export async function getCategoryTree(
  creds: FalabellaCredentials
): Promise<FalabellaCategory[]> {
  const body = await call<{ Categories: { Category: FalabellaCategory[] } }>(
    "GetCategoryTree",
    creds
  );
  return body.Categories.Category;
}

export async function getCategoryAttributes(
  creds: FalabellaCredentials,
  primaryCategory: string
): Promise<FalabellaCategoryAttribute[]> {
  const body = await call<{ Attribute: FalabellaCategoryAttribute[] }>(
    "GetCategoryAttributes",
    creds,
    { PrimaryCategory: primaryCategory }
  );
  return Array.isArray(body.Attribute) ? body.Attribute : [body.Attribute];
}

// Predice la categoría para un SKU dado su nombre — clave para optimización de títulos
export async function getCategorySuggestion(
  creds: FalabellaCredentials,
  skuName: string
): Promise<{ CategoryId: string; CategoryName: string }[]> {
  const body = await call<{ Categories: { Category: Array<{ CategoryId: string; CategoryName: string }> } }>(
    "GetCategorySuggestion",
    creds,
    { Search: skuName, Name: skuName }
  );
  return body.Categories.Category ?? [];
}

// --- Órdenes -----------------------------------------------------------------

export async function getOrders(
  creds: FalabellaCredentials,
  options: { createdAfter?: string; createdBefore?: string; limit?: number; offset?: number; status?: string } = {}
): Promise<FalabellaOrder[]> {
  const extra: Record<string, string> = {
    Limit: String(options.limit ?? 100),
    Offset: String(options.offset ?? 0),
    SortBy: "created_at",
    SortDirection: "DESC",
  };
  if (options.createdAfter) extra["CreatedAfter"] = options.createdAfter;
  if (options.createdBefore) extra["CreatedBefore"] = options.createdBefore;
  if (options.status) extra["Status"] = options.status;
  const body = await call<{ Orders: { Order: FalabellaOrder | FalabellaOrder[] } }>(
    "GetOrders",
    creds,
    extra
  );
  const raw = body.Orders.Order;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

// --- Crear y actualizar productos --------------------------------------------

export interface FalabellaNewProduct {
  sellerSku: string;
  name: string;
  description: string;
  brand: string;
  primaryCategory: string;          // CategoryId obtenido de getCategoryTree
  price: number;                    // COP, precio regular
  salePrice?: number;               // COP, precio con descuento (opcional)
  taxClass?: string;                // default "IVA19"
  quantity: number;
  images: string[];                 // URLs públicas de imágenes
  attributes?: Array<{ feedName: string; value: string }>;  // según getCategoryAttributes
}

export interface FalabellaFeedStatus {
  Feed: string;
  Status: "Queued" | "Processing" | "Finished" | "Error";
  Action: string;
  CreationDate: string;
  UpdatedDate: string;
  TotalRecords: number;
  ProcessedRecords: number;
  FailedRecords: number;
  FeedErrors: string | { Error: Array<{ Message: string; Code: string }> };
}

function toXml(product: FalabellaNewProduct): string {
  const images = product.images.map((u) => `<Image>${u}</Image>`).join("\n        ");
  const attrs = (product.attributes ?? [])
    .map((a) => `<Attribute>\n          <FeedName>${a.feedName}</FeedName>\n          <Value>${a.value}</Value>\n        </Attribute>`)
    .join("\n        ");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<Request>
  <Product>
    <SellerSku>${product.sellerSku}</SellerSku>
    <Name><![CDATA[${product.name}]]></Name>
    <Description><![CDATA[${product.description}]]></Description>
    <Brand>${product.brand}</Brand>
    <PrimaryCategory>${product.primaryCategory}</PrimaryCategory>
    <Price>${product.price}</Price>
    <SalePrice>${product.salePrice ?? product.price}</SalePrice>
    <TaxClass>${product.taxClass ?? "IVA19"}</TaxClass>
    <Quantity>${product.quantity}</Quantity>
    <Images>
        ${images}
    </Images>
    ${attrs ? `<Attributes>\n        ${attrs}\n    </Attributes>` : ""}
  </Product>
</Request>`;
}

// Crea un producto en borrador. Devuelve el FeedId para consultar el estado.
export async function createProduct(
  creds: FalabellaCredentials,
  product: FalabellaNewProduct
): Promise<string> {
  const body = await callPost<{ FeedId: string }>(
    "ProductCreate",
    creds,
    toXml(product)
  );
  return body.FeedId;
}

// Actualiza un producto existente por SellerSku.
export async function updateProduct(
  creds: FalabellaCredentials,
  product: Partial<FalabellaNewProduct> & { sellerSku: string }
): Promise<string> {
  const body = await callPost<{ FeedId: string }>(
    "ProductUpdate",
    creds,
    toXml(product as FalabellaNewProduct)
  );
  return body.FeedId;
}

// Consulta el estado de procesamiento de un feed (crear/actualizar producto).
export async function getFeedStatus(
  creds: FalabellaCredentials,
  feedId: string
): Promise<FalabellaFeedStatus> {
  const body = await call<{ FeedDetail: FalabellaFeedStatus }>(
    "GetFeedStatus",
    creds,
    { FeedId: feedId }
  );
  return body.FeedDetail;
}

// --- Compatibilidad con la interfaz base Listing ----------------------------
import type { Listing } from "../types/index.js";

export async function getListing(
  creds: FalabellaCredentials,
  sellerSku: string
): Promise<Listing> {
  const products = await getProducts(creds, { limit: 1 });
  const match = products.find((p) => p.SellerSku === sellerSku);
  if (!match) throw new Error(`SKU ${sellerSku} not found in Falabella seller catalog`);
  return {
    id: match.SellerSku,
    marketplace: "falabella",
    title: match.Name,
    price: parseFloat(match.SalePrice || match.Price),
    currency: "COP",
    stock: match.Quantity,
    url: match.Url,
  };
}

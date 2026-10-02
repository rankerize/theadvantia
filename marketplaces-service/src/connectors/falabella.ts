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
): Promise<T & { _requestId?: string; _warnings?: Array<{ Field: string; Message: string }> }> {
  const url = buildUrl(action, creds);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/xml; charset=utf-8", Accept: "application/json" },
    body: xmlBody,
  });
  if (!res.ok) throw new Error(`Falabella SC ${action} POST HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    SuccessResponse?: {
      Head: { RequestId: string };
      Body: T | "" | { WarningDetail: Array<{ Field: string; Message: string }> };
    };
    ErrorResponse?: { Head: { ErrorMessage: string } };
  };
  if (json.ErrorResponse) throw new Error(`Falabella SC error: ${json.ErrorResponse.Head.ErrorMessage}`);
  const sr = json.SuccessResponse!;
  const body = sr.Body;
  const requestId = sr.Head?.RequestId;
  // Body vacío ("") = éxito sin FeedId — ocurre en ProductCreate exitoso
  if (body === "" || body === null || body === undefined) {
    return { _requestId: requestId } as T & { _requestId?: string };
  }
  // Body con WarningDetail = parcialmente aceptado (faltan atributos de variación)
  const warnings = (body as { WarningDetail?: Array<{ Field: string; Message: string }> }).WarningDetail;
  if (warnings) {
    return { _requestId: requestId, _warnings: warnings } as T & { _requestId?: string; _warnings?: Array<{ Field: string; Message: string }> };
  }
  return { ...body as T, _requestId: requestId };
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
  isMandatory: string;    // "1" = requerido (la API devuelve string, no number)
  IsGlobalAttribute: string;
  Description: string;
  ProductType: string;
  InputType: string;
  AttributeType: string;
  ExampleValue: string;
  MaxLength: string;
  // Falabella envía Options como { Option: [...] } cuando hay opciones, o "" cuando no hay
  Options?: { Option: Array<{ GlobalIdentifier: string; Name: string; isDefault: string; id: string }> | { GlobalIdentifier: string; Name: string; isDefault: string; id: string } } | "";
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
  const body = await call<{
    SuggestedCategory?: { CategoryId: string; CategoryName: string; SuggestedCategory?: string };
    Categories?: { Category: Array<{ CategoryId: string; CategoryName: string }> };
  }>("GetCategorySuggestion", creds, { Name: skuName });
  // Falabella devuelve un objeto único SuggestedCategory, no un array
  if (body.SuggestedCategory) return [body.SuggestedCategory];
  return body.Categories?.Category ?? [];
}

export async function getBrands(
  creds: FalabellaCredentials
): Promise<Array<{ BrandId: string; Name: string; GlobalIdentifier: string }>> {
  // Falabella devuelve Brands como array de { Brand: {...} }, no como un array plano
  const body = await call<{ Brands: Array<{ Brand: { BrandId: string; Name: string; GlobalIdentifier: string } }> | { Brand: Array<{ BrandId: string; Name: string; GlobalIdentifier: string }> } }>(
    "GetBrands",
    creds
  );
  const raw = body.Brands;
  if (!raw) return [];
  // Formato A: [{ Brand: {...} }, ...]
  if (Array.isArray(raw)) return raw.map((b) => (b as { Brand: { BrandId: string; Name: string; GlobalIdentifier: string } }).Brand);
  // Formato B: { Brand: [...] }
  const inner = (raw as { Brand: Array<{ BrandId: string; Name: string; GlobalIdentifier: string }> }).Brand;
  return Array.isArray(inner) ? inner : [inner];
}

export async function getShipmentProviders(
  creds: FalabellaCredentials
): Promise<Array<{ Name: string; Default: string; ApiDefault: string }>> {
  const body = await call<{ ShipmentProviders: { ShipmentProvider: Array<{ Name: string; Default: string; ApiDefault: string }> } }>(
    "GetShipmentProviders",
    creds
  );
  return body.ShipmentProviders.ShipmentProvider ?? [];
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
  // Atributos de variación: van como elementos XML directos (no dentro de <Attributes>)
  color?: string;                   // ej: "Dorado"
  colorBasico?: string;             // ej: "Dorado"
  talla?: string;                   // ej: "Talla única"
  attributes?: Array<{ feedName: string; value: string }>;  // atributos no-variación
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

function escXml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toXml(product: FalabellaNewProduct): string {
  const images = product.images.map((u) => `<Image><![CDATA[${u}]]></Image>`).join("\n        ");
  // Atributos normales (no-variación): van dentro de <Attributes>
  const attrs = (product.attributes ?? [])
    .map((a) => `<Attribute>\n          <FeedName>${escXml(a.feedName)}</FeedName>\n          <Value><![CDATA[${a.value}]]></Value>\n        </Attribute>`)
    .join("\n        ");
  const salePrice = product.salePrice ?? product.price;
  // Atributos de variación: van como elementos directos del <Product> (no dentro de <Attributes>)
  const variantFields = [
    product.color ? `<Color><![CDATA[${product.color}]]></Color>` : "",
    product.colorBasico ? `<ColorBasico><![CDATA[${product.colorBasico}]]></ColorBasico>` : "",
    product.talla ? `<Talla><![CDATA[${product.talla}]]></Talla>` : "",
  ].filter(Boolean).join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<Request>
  <Product>
    <SellerSku>${escXml(product.sellerSku)}</SellerSku>
    <Name><![CDATA[${product.name}]]></Name>
    <Description><![CDATA[${product.description}]]></Description>
    <Brand><![CDATA[${product.brand}]]></Brand>
    <PrimaryCategory>${product.primaryCategory}</PrimaryCategory>
    <Price>${product.price}</Price>
    <SalePrice>${salePrice}</SalePrice>
    <TaxClass>${product.taxClass ?? "IVA19"}</TaxClass>
    <Quantity>${product.quantity}</Quantity>
    ${variantFields}
    <Images>
        ${images}
    </Images>
    <BusinessUnits>
      <BusinessUnit>
        <OperatorCode>faco</OperatorCode>
        <Active>1</Active>
        <Price>${product.price}</Price>
        <SalePrice>${salePrice}</SalePrice>
        <SaleStartDate></SaleStartDate>
        <SaleEndDate></SaleEndDate>
      </BusinessUnit>
    </BusinessUnits>
    ${attrs ? `<Attributes>\n        ${attrs}\n    </Attributes>` : ""}
  </Product>
</Request>`;
}

// Crea un producto en borrador. Devuelve el FeedId o RequestId para rastreo.
export async function createProduct(
  creds: FalabellaCredentials,
  product: FalabellaNewProduct
): Promise<{ id: string; warnings?: Array<{ Field: string; Message: string }> }> {
  const body = await callPost<{ FeedId?: string }>(
    "ProductCreate",
    creds,
    toXml(product)
  );
  return { id: body.FeedId ?? body._requestId ?? "unknown", warnings: body._warnings };
}

// Actualiza un producto existente por SellerSku.
export async function updateProduct(
  creds: FalabellaCredentials,
  product: Partial<FalabellaNewProduct> & { sellerSku: string }
): Promise<{ id: string; warnings?: Array<{ Field: string; Message: string }> }> {
  const body = await callPost<{ FeedId?: string }>(
    "ProductUpdate",
    creds,
    toXml(product as FalabellaNewProduct)
  );
  return { id: body.FeedId ?? body._requestId ?? "unknown", warnings: body._warnings };
}

// Consulta el estado de un feed vía GetFeedRawInput.
// GetFeedStatus/GetFeedList no existen en sellercenter-api.falabella.com (E008).
export async function getFeedStatus(
  creds: FalabellaCredentials,
  feedId: string
): Promise<FalabellaFeedStatus> {
  const body = await call<{ FeedDetail: FalabellaFeedStatus }>(
    "GetFeedRawInput",
    creds,
    { FeedIdList: `[${feedId}]` }
  );
  return body.FeedDetail;
}

export interface FalabellaWarehouse {
  WarehouseId: string;
  Name: string;
  AddressType: string;
  IsDefault: string;
}

export async function getWarehouse(
  creds: FalabellaCredentials
): Promise<FalabellaWarehouse[]> {
  const body = await call<{ Warehouses: { Warehouse: FalabellaWarehouse | FalabellaWarehouse[] } }>(
    "GetWarehouse",
    creds
  );
  const raw = body.Warehouses.Warehouse;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
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

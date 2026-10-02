import { createProduct, getFeedStatus, getCategorySuggestion } from "./src/connectors/falabella.js";

const creds = { userId: process.env.FALA_USER_ID!, apiKey: process.env.FALA_API_KEY! };

// 1. Sugerir categoría para el producto
console.log("=== Sugerencia de categoría ===");
const sugs = await getCategorySuggestion(creds, "televisor samsung 55 pulgadas 4k");
console.log(JSON.stringify(sugs.slice(0, 3), null, 2));

const categoryId = sugs[0]?.CategoryId ?? "999";
console.log(`\nUsando categoryId: ${categoryId}\n`);

// 2. Crear producto en borrador
console.log("=== Crear producto (borrador) ===");
const feedId = await createProduct(creds, {
  sellerSku: "ADVANTIA-TEST-001",
  name: "Televisor Samsung 55 Pulgadas 4K UHD Smart TV",
  description: "Televisor Samsung de 55 pulgadas con resolución 4K UHD, Smart TV con acceso a Netflix, Prime Video y más. Sistema operativo Tizen.",
  brand: "Samsung",
  primaryCategory: categoryId,
  price: 2499000,
  salePrice: 2199000,
  taxClass: "IVA19",
  quantity: 0,   // 0 = borrador sin stock
  images: [
    "https://images.samsung.com/co/televisions-home-theater/tvs/crystal-uhd/55-inch-cu7000-crystal-uhd-4k-smart-tv-2023-ua55cu7000kxzl-534861882.jpg"
  ],
  attributes: [],
});

console.log(`FeedId recibido: ${feedId}`);

// 3. Consultar estado del feed
console.log("\n=== Estado del feed ===");
await new Promise(r => setTimeout(r, 2000)); // esperar 2s
const status = await getFeedStatus(creds, feedId);
console.log(JSON.stringify(status, null, 2));

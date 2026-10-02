// Script de prueba rápida — ejecutar con:
// FALA_USER_ID=xxx FALA_API_KEY=xxx npx tsx test-falabella.ts
import { getProducts, getCategoryTree, getCategorySuggestion } from "./src/connectors/falabella.js";

const creds = {
  userId: process.env.FALA_USER_ID ?? "",
  apiKey: process.env.FALA_API_KEY ?? "",
};

if (!creds.userId || !creds.apiKey) {
  console.error("Faltan variables de entorno: FALA_USER_ID y FALA_API_KEY");
  process.exit(1);
}

console.log("=== GetProducts ===");
try {
  const products = await getProducts(creds, { limit: 5 });
  console.log(`Total productos recibidos: ${products.length}`);
  console.log(JSON.stringify(products[0], null, 2));
} catch (e) {
  console.error("Error GetProducts:", e);
}

console.log("\n=== GetCategoryTree (primeras 3 categorías) ===");
try {
  const cats = await getCategoryTree(creds);
  console.log(`Total categorías raíz: ${cats.length}`);
  console.log(JSON.stringify(cats.slice(0, 3), null, 2));
} catch (e) {
  console.error("Error GetCategoryTree:", e);
}

console.log("\n=== GetCategorySuggestion: 'televisor samsung 55' ===");
try {
  const suggestions = await getCategorySuggestion(creds, "televisor samsung 55");
  console.log(JSON.stringify(suggestions, null, 2));
} catch (e) {
  console.error("Error GetCategorySuggestion:", e);
}

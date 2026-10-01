export type Marketplace = "mercadolibre" | "falabella" | "amazon" | "homecenter";

export interface Listing {
  id: string;
  marketplace: Marketplace;
  title: string;
  price: number;
  currency: "COP";
  stock: number;
  url: string;
}

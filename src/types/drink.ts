export interface DrinkCatalogItem {
  id: string;
  name: string;
  emoji: string;
  abv: number;
  volumeMl: number;
  standardDrinks: number;
  category: 'beer' | 'cocktail' | 'shot' | 'wine' | 'other';
}

export interface DrinkLogEntry {
  id: string;
  catalogItemId: string;
  loggedAt: string;
  userId: string;
}

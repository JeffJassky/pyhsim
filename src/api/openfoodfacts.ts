import type { FoodSearchHit, TrackedNutrients } from '@/types';

const SEARCH_ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';

const getNutriment = (nutriments: Record<string, unknown>, key: string) => {
  const servingVal = nutriments?.[`${key}_serving`];
  if (typeof servingVal === 'number') return servingVal;
  const per100 = nutriments?.[`${key}_100g`];
  if (typeof per100 === 'number') return per100;
  return 0;
};

const mapProductToHit = (product: any): FoodSearchHit | null => {
  const name = product?.product_name || product?.generic_name;
  const id = product?.code;
  if (!name || !id) return null;
  const nutriments = product?.nutriments || {};
  const nutrients: TrackedNutrients = {
    calories: getNutriment(nutriments, 'energy-kcal'),
    protein: getNutriment(nutriments, 'proteins'),
    fat: getNutriment(nutriments, 'fat'),
    carbs: getNutriment(nutriments, 'carbohydrates'),
    fiber: getNutriment(nutriments, 'fiber'),
    sugar: getNutriment(nutriments, 'sugars'),
    sodium: getNutriment(nutriments, 'sodium'),
  };

  return {
    id: String(id),
    name: name as string,
    brand: product?.brands,
    serving: product?.serving_size || '100g',
    nutrients,
    image: product?.image_front_thumb_url || product?.image_thumb_url,
  };
};

export interface FoodSearchResult {
  hits: FoodSearchHit[];
  total: number;
  page: number;
  pageCount: number;
}

export const searchFoods = async (term: string, page = 1, pageSize = 20): Promise<FoodSearchResult> => {
  if (!term.trim()) {
    return { hits: [], total: 0, page: 1, pageCount: 0 };
  }

  const params = new URLSearchParams({
    search_terms: term,
    search_simple: '1',
    json: '1',
    page: String(page),
    page_size: String(pageSize),
    fields: 'product_name,generic_name,brands,code,serving_size,nutriments,image_front_thumb_url,image_thumb_url',
  });

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to reach OpenFoodFacts');
  }
  const data = await response.json();
  const products = Array.isArray(data?.products) ? data.products : [];
  const hits = products.map(mapProductToHit).filter(Boolean) as FoodSearchHit[];
  const total = data?.count ?? hits.length;
  const pageCount = data?.page_count ?? Math.ceil(total / pageSize);
  const pageNum = data?.page ?? page;
  return { hits, total, page: pageNum, pageCount };
};

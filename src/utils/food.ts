/**
 * Food-related utilities for converting nutritional data to intervention params
 */

import type { TrackedNutrients, TimelineItem, UUID, ParamValues } from '@/types';
import { v4 as uuid } from 'uuid';

export interface FoodInterventionParams {
  carbSugar: number;
  carbStarch: number;
  protein: number;
  fat: number;
  fiberSol: number;
  fiberInsol: number;
  hydration: number;
  gi: number;
}

/**
 * Estimate glycemic index (%) from macronutrient composition
 * Higher sugar:starch ratio and lower fiber = higher GI
 */
function estimateGI(nutrients: TrackedNutrients): number {
  const sugar = nutrients.sugar || 0;
  const carbs = nutrients.carbs || 0;
  const fiber = nutrients.fiber || 0;
  const protein = nutrients.protein || 0;
  const fat = nutrients.fat || 0;

  if (carbs <= 0) return 40; // Low-carb foods have minimal glycemic impact

  // Base GI from sugar ratio
  const sugarRatio = sugar / carbs;
  let baseGI = 50 + sugarRatio * 30; // 50-80 range based on sugar

  // Fiber lowers GI
  const fiberEffect = Math.min(fiber / 10, 1) * 15; // Up to -15 from fiber

  // Fat and protein slow absorption, lowering effective GI
  const fatProteinEffect = Math.min((fat + protein) / 30, 1) * 10; // Up to -10

  return Math.round(Math.max(20, Math.min(100, baseGI - fiberEffect - fatProteinEffect)));
}

/**
 * Convert TrackedNutrients (from food API) to food intervention params
 */
export function nutrientsToFoodParams(nutrients: TrackedNutrients, quantity: number = 1): FoodInterventionParams {
  const sugar = (nutrients.sugar || 0) * quantity;
  const carbs = (nutrients.carbs || 0) * quantity;
  const fiber = (nutrients.fiber || 0) * quantity;
  const protein = (nutrients.protein || 0) * quantity;
  const fat = (nutrients.fat || 0) * quantity;

  // Estimate starch = total carbs - sugar - fiber
  const starch = Math.max(0, carbs - sugar - fiber);

  // Split fiber into soluble/insoluble (typical ratio ~30/70)
  const fiberSol = Math.round(fiber * 0.3);
  const fiberInsol = Math.round(fiber * 0.7);

  // Estimate hydration based on meal type (most solid foods are ~50-70% water)
  // Average meal ~200-300ml implicit hydration
  const estimatedHydration = Math.round(150 + (carbs + protein + fat) * 0.5);

  return {
    carbSugar: Math.round(sugar),
    carbStarch: Math.round(starch),
    protein: Math.round(protein),
    fat: Math.round(fat),
    fiberSol,
    fiberInsol,
    hydration: Math.min(1200, estimatedHydration),
    gi: estimateGI(nutrients),
  };
}

/**
 * Create a food timeline item
 */
export function createFoodTimelineItem(
  startISO: string,
  nutrients: TrackedNutrients,
  quantity: number = 1,
  labelOverride?: string
): TimelineItem {
  const params = nutrientsToFoodParams(nutrients, quantity);

  // Food consumption duration: 15-45 min depending on calories
  const calories = (nutrients.calories || 200) * quantity;
  const durationMin = Math.max(15, Math.min(45, Math.round(calories / 20)));

  // Calculate end time
  const startDate = new Date(startISO);
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  return {
    id: uuid() as UUID,
    start: startISO,
    end: endDate.toISOString(),
    type: 'range',
    meta: {
      key: 'food',
      params: params as unknown as ParamValues,
      intensity: 1,
      labelOverride,
    },
  };
}

/**
 * Convert ISO date string to minute of day
 */
export function isoToMinuteOfDay(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Create an ISO timestamp for a specific time today
 */
export function todayAtTime(hours: number, minutes: number = 0): string {
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now.toISOString();
}

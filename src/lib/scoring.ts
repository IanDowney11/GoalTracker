import { DailyEntry, AlcoholLevel, TempGoalDef } from '@/types';

const alcoholScores: Record<AlcoholLevel, number> = {
  none: 1.0,
  low: 0.66,
  medium: 0.33,
  high: 0.0,
};

/** Returns score 0-1, or null if N/A */
export function getQuestionScore(
  questionId: keyof Omit<DailyEntry, 'date' | 'tempGoals'>,
  entry: DailyEntry
): number | null {
  switch (questionId) {
    case 'alcohol':
      return alcoholScores[entry.alcohol];
    case 'followMealPlan':
      return entry.followMealPlan ? 1.0 : 0.0;
    case 'eatSugar':
      return entry.eatSugar ? 0.0 : 1.0; // No sugar = good
    case 'tenThousandSteps':
      return entry.tenThousandSteps ? 1.0 : 0.0;
    case 'exercise':
      if (entry.exercise === null) return null; // N/A
      return entry.exercise ? 1.0 : 0.0;
    default:
      return 0;
  }
}

/** Returns score for a temp goal, or null if N/A / not answered */
export function getTempGoalScore(goalId: string, entry: DailyEntry): number | null {
  const val = entry.tempGoals?.[goalId];
  if (val === undefined || val === null) return null;
  return val ? 1.0 : 0.0;
}

/** Get active temp goals for a given date */
export function getActiveTempGoals(tempGoalDefs: TempGoalDef[], date: string): TempGoalDef[] {
  return tempGoalDefs.filter((def) => {
    if (date < def.createdDate) return false;
    if (def.endDate && date > def.endDate) return false;
    return true;
  });
}

/**
 * Calculate day score with weighted temp goals.
 * Core goals share (100% - 5% * numActiveTempGoals) equally.
 * Each active temp goal = 5%.
 * N/A goals are excluded and their weight redistributes proportionally.
 */
export function getDayScore(entry: DailyEntry, tempGoalDefs: TempGoalDef[] = []): number {
  const activeTempGoals = getActiveTempGoals(tempGoalDefs, entry.date);
  const numActiveTempGoals = activeTempGoals.length;

  const coreWeight = numActiveTempGoals > 0 ? (1.0 - 0.05 * numActiveTempGoals) : 1.0;
  const tempWeight = 0.05;

  // Collect core scores with weights
  const coreQuestionIds: (keyof Omit<DailyEntry, 'date' | 'tempGoals'>)[] = [
    'alcohol', 'followMealPlan', 'eatSugar', 'tenThousandSteps', 'exercise',
  ];

  const items: { score: number; weight: number }[] = [];
  const perCoreWeight = coreWeight / coreQuestionIds.length;

  for (const qId of coreQuestionIds) {
    const score = getQuestionScore(qId, entry);
    if (score !== null) {
      items.push({ score, weight: perCoreWeight });
    }
  }

  for (const def of activeTempGoals) {
    const score = getTempGoalScore(def.id, entry);
    if (score !== null) {
      items.push({ score, weight: tempWeight });
    }
  }

  if (items.length === 0) return 0;

  // Redistribute weights proportionally among non-N/A goals
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  return items.reduce((sum, item) => sum + item.score * (item.weight / totalWeight), 0);
}

/**
 * Interpolate color: 0.0 = red (#ef4444) → 0.5 = orange (#f97316) → 1.0 = green (#22c55e)
 */
export function scoreToColor(score: number): string {
  const clamp = Math.max(0, Math.min(1, score));

  let r: number, g: number, b: number;

  if (clamp <= 0.5) {
    const t = clamp / 0.5;
    r = lerp(239, 249, t);
    g = lerp(68, 115, t);
    b = lerp(68, 22, t);
  } else {
    const t = (clamp - 0.5) / 0.5;
    r = lerp(249, 34, t);
    g = lerp(115, 197, t);
    b = lerp(22, 94, t);
  }

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Check if a question's answer is "good" for streak counting. N/A does not break streaks. */
export function isGoodAnswer(
  questionId: keyof Omit<DailyEntry, 'date' | 'tempGoals'>,
  entry: DailyEntry
): boolean {
  const score = getQuestionScore(questionId, entry);
  if (score === null) return true; // N/A doesn't break streak
  return score === 1.0;
}

/** Check if a temp goal answer is "good" for streak counting. N/A doesn't break streak. */
export function isTempGoalGoodAnswer(goalId: string, entry: DailyEntry): boolean {
  const score = getTempGoalScore(goalId, entry);
  if (score === null) return true;
  return score === 1.0;
}

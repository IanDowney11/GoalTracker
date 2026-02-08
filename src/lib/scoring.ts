import { DailyEntry, AlcoholLevel } from '@/types';

const alcoholScores: Record<AlcoholLevel, number> = {
  none: 1.0,
  low: 0.66,
  medium: 0.33,
  high: 0.0,
};

export function getQuestionScore(
  questionId: keyof Omit<DailyEntry, 'date'>,
  entry: DailyEntry
): number {
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
      return entry.exercise ? 1.0 : 0.0;
    default:
      return 0;
  }
}

export function getDayScore(entry: DailyEntry): number {
  const scores = [
    getQuestionScore('alcohol', entry),
    getQuestionScore('followMealPlan', entry),
    getQuestionScore('eatSugar', entry),
    getQuestionScore('tenThousandSteps', entry),
    getQuestionScore('exercise', entry),
  ];
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Interpolate color: 0.0 = red (#ef4444) → 0.5 = orange (#f97316) → 1.0 = green (#22c55e)
 */
export function scoreToColor(score: number): string {
  const clamp = Math.max(0, Math.min(1, score));

  // Red: #ef4444 = rgb(239, 68, 68)
  // Orange: #f97316 = rgb(249, 115, 22)
  // Green: #22c55e = rgb(34, 197, 94)

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

/** Check if a question's answer is "good" (perfect score) for streak counting */
export function isGoodAnswer(
  questionId: keyof Omit<DailyEntry, 'date'>,
  entry: DailyEntry
): boolean {
  return getQuestionScore(questionId, entry) === 1.0;
}

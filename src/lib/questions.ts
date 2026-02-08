import { QuestionDef } from '@/types';

export const questions: QuestionDef[] = [
  {
    id: 'alcohol',
    label: 'How much alcohol did you drink?',
    shortLabel: 'Alcohol',
    type: 'alcohol',
    streakLabel: 'days without alcohol',
  },
  {
    id: 'followMealPlan',
    label: 'Did you follow your meal plan?',
    shortLabel: 'Meal Plan',
    type: 'boolean',
    goodAnswer: true,
    streakLabel: 'days following meal plan',
  },
  {
    id: 'eatSugar',
    label: 'Did you eat sugar?',
    shortLabel: 'Sugar',
    type: 'boolean',
    goodAnswer: false,
    streakLabel: 'days without sugar',
  },
  {
    id: 'tenThousandSteps',
    label: 'Did you hit 10,000 steps?',
    shortLabel: '10K Steps',
    type: 'boolean',
    goodAnswer: true,
    streakLabel: 'days hitting 10K steps',
  },
  {
    id: 'exercise',
    label: 'Did you exercise?',
    shortLabel: 'Exercise',
    type: 'boolean',
    goodAnswer: true,
    streakLabel: 'days exercising',
  },
];

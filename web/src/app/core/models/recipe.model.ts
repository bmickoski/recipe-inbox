export type Recipe = {
  id: string;
  url: string;
  title: string | null;
  image: string | null;
  description: string | null;
  status: 'WANT_TO_TRY' | 'COOKED';
  cookedAt: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  createdBy: string;
  boardId: string;
};

export const RECIPE_TAGS = ['dinner', 'dessert', 'weekend', 'quick'] as const;

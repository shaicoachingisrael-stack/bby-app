export type Program = {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number | null;
  level: 'debutant' | 'intermediaire' | 'avance' | null;
  cover_url: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  program_id: string | null;
  title: string;
  description: string | null;
  duration_min: number | null;
  video_url: string | null;
  order_index: number;
  created_at: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  video_url: string | null;
  meal_type: 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation' | null;
  prep_min: number | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ingredients: string | null;
  created_at: string;
};

export type MindsetContent = {
  id: string;
  kind: 'meditation' | 'article' | 'affirmation';
  title: string;
  body: string | null;
  cover_url: string | null;
  duration_min: number | null;
  created_at: string;
};

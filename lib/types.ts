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

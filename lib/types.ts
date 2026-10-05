type I18nMap = Record<string, Record<string, string>> | null;

export type Program = {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number | null;
  level: 'debutant' | 'intermediaire' | 'avance' | null;
  cover_url: string | null;
  created_at: string;
  i18n?: I18nMap;
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
  i18n?: I18nMap;
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
  i18n?: I18nMap;
};

export type MindsetContent = {
  id: string;
  kind: 'meditation' | 'article' | 'affirmation';
  title: string;
  body: string | null;
  cover_url: string | null;
  duration_min: number | null;
  created_at: string;
  i18n?: I18nMap;
};

export type DailyAffirmation = {
  month: number;
  day: number;
  text: string;
  i18n?: I18nMap;
};

export type CoachingClient = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  goal: string | null;
  is_personal_coaching: boolean;
  coaching_interest: boolean;
  coaching_note: string | null;
  coaching_started_at: string | null;
};

export type CoachingConfig = {
  id: string;
  pitch: string | null;
  perks: string | null;
  updated_at: string;
};

export type CoachingPlan = {
  id: string;
  months: number;
  price_text: string;
  subtitle: string | null;
  highlighted: boolean;
  sort_order: number;
  created_at: string;
};

export type CoachingAssignmentType = 'session' | 'recipe' | 'mindset' | 'custom';

export type CoachingAssignment = {
  id: string;
  client_id: string;
  scheduled_date: string | null;
  item_type: CoachingAssignmentType;
  ref_id: string | null;
  title: string | null;
  description: string | null;
  video_url: string | null;
  coach_note: string | null;
  done: boolean;
  done_at: string | null;
  sort_order: number;
  created_at: string;
};

export type CoachingMessage = {
  id: string;
  client_id: string;
  sender: 'coach' | 'client';
  content: string;
  read_at: string | null;
  created_at: string;
};

export type MindsetProgram = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  day_count: number;
  cover_url: string | null;
  sort_order: number;
  created_at: string;
  i18n?: I18nMap;
};

export type MindsetProgramStepKind = 'breathing' | 'affirmation' | 'reading' | 'journal_prompt' | 'meditation';

export type MindsetProgramStep = {
  id: string;
  program_id: string;
  day_number: number;
  kind: MindsetProgramStepKind;
  ref_slug: string | null;
  ref_content_id: string | null;
  title: string | null;
  prompt_text: string | null;
  sort_order: number;
  i18n?: I18nMap;
};

export type MindsetProgramProgress = {
  id: string;
  user_id: string;
  program_id: string;
  current_day: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
};

export type RitualCatalogItem = {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  created_at: string;
  i18n?: I18nMap;
};

export type UserRitual = {
  id: string;
  user_id: string;
  label: string;
  icon: string;
  catalog_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type RitualCheck = {
  id: string;
  user_id: string;
  ritual_id: string;
  check_date: string;
  created_at: string;
};

export type AttachmentParentType = 'session' | 'recipe' | 'mindset';

export type MediaAttachment = {
  id: string;
  parent_type: AttachmentParentType;
  parent_id: string;
  kind: 'video' | 'image';
  url: string;
  title: string | null;
  order_index: number;
  created_at: string;
};

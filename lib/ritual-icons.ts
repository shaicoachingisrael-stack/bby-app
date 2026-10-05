import {
  Apple,
  Bike,
  BookOpen,
  Circle,
  Clock,
  Coffee,
  Droplet,
  Flame,
  Footprints,
  Heart,
  Leaf,
  type LucideIcon,
  Moon,
  Music,
  Pill,
  Smile,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Wind,
} from 'lucide-react-native';

// Bibliothèque d'icônes disponibles pour les rituels (Note dev §3.6).
// Le champ `icon` (catalogue + rituels perso) stocke une de ces clés.
export const RITUAL_ICONS: Record<string, LucideIcon> = {
  droplet: Droplet,
  pill: Pill,
  footprints: Footprints,
  snowflake: Snowflake,
  wind: Wind,
  moon: Moon,
  leaf: Leaf,
  heart: Heart,
  sunrise: Sunrise,
  sparkles: Sparkles,
  sun: Sun,
  coffee: Coffee,
  book: BookOpen,
  music: Music,
  bike: Bike,
  apple: Apple,
  flame: Flame,
  smile: Smile,
  clock: Clock,
  circle: Circle,
};

export const RITUAL_ICON_KEYS = Object.keys(RITUAL_ICONS);

export function ritualIcon(key: string | null | undefined): LucideIcon {
  return (key && RITUAL_ICONS[key]) || Circle;
}

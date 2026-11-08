// Flèches qui suivent le sens de lecture : en hébreu (de droite à gauche), « retour » pointe
// vers la droite et « suivant » vers la gauche. Mêmes noms et mêmes props que lucide-react-native.
import {
  ArrowLeft as LArrowLeft,
  ArrowRight as LArrowRight,
  ChevronLeft as LChevronLeft,
  ChevronRight as LChevronRight,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react-native';
import { I18nManager, View } from 'react-native';

function mirrored(Icon: LucideIcon, name: string): LucideIcon {
  // Le miroir est appliqué à un cadre autour de l'icône : appliqué au dessin lui-même, il le faisait disparaître.
  const C = ((props: LucideProps) =>
    I18nManager.isRTL ? (
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <Icon {...props} />
      </View>
    ) : (
      <Icon {...props} />
    )) as unknown as LucideIcon & { displayName?: string };
  C.displayName = name;
  return C as unknown as LucideIcon;
}

export const ArrowLeft = mirrored(LArrowLeft, 'ArrowLeft');
export const ArrowRight = mirrored(LArrowRight, 'ArrowRight');
export const ChevronLeft = mirrored(LChevronLeft, 'ChevronLeft');
export const ChevronRight = mirrored(LChevronRight, 'ChevronRight');

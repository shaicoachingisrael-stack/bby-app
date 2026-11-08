// Sens de lecture de l'app : de droite à gauche en hébreu, de gauche à droite sinon.
// React Native n'applique un changement de sens qu'après un redémarrage de l'app :
// on mémorise le sens voulu (I18nManager, gardé par le téléphone) puis on recharge une fois.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';

const RTL_LOCALES = ['he'];
const GUARD_KEY = 'bby.rtlReloadAt';

export const isRtlLocale = (locale: string | null | undefined) => !!locale && RTL_LOCALES.includes(locale.slice(0, 2));

/** Met l'app dans le bon sens pour cette langue ; recharge l'app si le sens change. */
export async function ensureDirection(locale: string | null | undefined) {
  if (Platform.OS === 'web') return;
  const rtl = isRtlLocale(locale);
  if (I18nManager.isRTL === rtl) return;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  // Garde-fou : jamais deux rechargements en moins de 15 secondes (évite une boucle
  // si le téléphone refusait le changement de sens).
  try {
    const last = Number(await AsyncStorage.getItem(GUARD_KEY)) || 0;
    if (Date.now() - last < 15000) return;
    await AsyncStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch {
    // stockage indisponible : on recharge quand même, une fois
  }
  try {
    await reloadAppAsync('direction');
  } catch (e) {
    console.warn('reload for direction failed', e);
  }
}

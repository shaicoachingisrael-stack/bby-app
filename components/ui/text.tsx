// Texte de l'app : identique à celui de React Native, avec le sens d'écriture de la langue.
// En hébreu (sens forcé de droite à gauche), iOS alignait quand même les textes à gauche
// car le téléphone, lui, est en français : on donne donc le sens à chaque texte.
import type { ComponentPropsWithRef } from 'react';
import { I18nManager, Text as RNText, TextInput as RNTextInput } from 'react-native';

const RTL_STYLE = { writingDirection: 'rtl' as const };

export function Text(props: ComponentPropsWithRef<typeof RNText>) {
  if (!I18nManager.isRTL) return <RNText {...props} />;
  return <RNText {...props} style={[RTL_STYLE, props.style]} />;
}

export function TextInput(props: ComponentPropsWithRef<typeof RNTextInput>) {
  if (!I18nManager.isRTL) return <RNTextInput {...props} />;
  return <RNTextInput {...props} style={[RTL_STYLE, props.style]} />;
}

// Même nom utilisable comme type (ex. useRef<TextInput>), comme avec React Native.
export type TextInput = RNTextInput;
export type Text = RNText;

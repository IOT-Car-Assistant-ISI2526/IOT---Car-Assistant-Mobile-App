// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;


const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'menu': 'menu',
  'xmark': 'close',
  'cloud.fill': 'cloud',
  'gearshape.fill': 'settings',
  'bar-chart.fill': 'bar-chart',
  'antenna.radiowaves.left.and.right': 'bluetooth',
  'bluetooth': 'bluetooth',
  'chart.bar.fill': 'build',
  'wrench.fill': 'build',
  'tool.fill': 'build',
  'car.fill': 'directions-car',
  'parking.fill': 'local-parking',
  'p.circle.fill': 'local-parking',
  'exclamationmark.triangle.fill': 'warning',
  'checkmark-circle': 'checkmark-circle',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'person': 'person',
  'person.fill': 'person',
  'lock.fill': 'lock',
  'info.circle.fill': 'info',
  'info.circle': 'info',
} as IconMapping;


export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] || 'help-outline'} style={style} />;
}

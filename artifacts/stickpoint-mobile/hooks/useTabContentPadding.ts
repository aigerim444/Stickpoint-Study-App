import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding for tab screens: clears the absolute-positioned bottom tab
 * bar on phones, and shrinks on wide web where the TopNav replaces that bar
 * (otherwise every screen ends in 100px of dead space).
 */
export function useTabContentPadding(): number {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wideWeb = Platform.OS === 'web' && width > 680;
  return insets.bottom + (wideWeb ? 32 : 100);
}

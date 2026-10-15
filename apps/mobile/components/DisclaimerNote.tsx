import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, space } from '@/constants/theme';
import { Text } from '@/components/AppText';

/** Short "assistive tool, not a medical device" notice shown wherever results appear. */
export function DisclaimerNote() {
  const { t } = useTranslation();
  return (
    <View style={styles.box} accessible accessibilityRole="text">
      <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
      <Text style={styles.text}>{t('disclaimer.short')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.blueBg,
    borderRadius: radius.control,
    padding: space.md,
  },
  text: { flex: 1, color: '#1E3A8A', fontSize: 13, lineHeight: 19 },
});

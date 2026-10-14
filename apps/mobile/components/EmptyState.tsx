import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/constants/theme';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}

export function EmptyState({ icon, title, body }: Props) {
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${title}. ${body}`}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={44} color={colors.primary600} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: space.sm },
  body: { fontSize: 16, lineHeight: 24, color: colors.inkSoft, textAlign: 'center' },
});

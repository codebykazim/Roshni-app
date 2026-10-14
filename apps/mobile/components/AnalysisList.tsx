import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import type { Analysis } from '@/lib/db';
import { useSettings } from '@/lib/store/settings';

interface Props {
  items: Analysis[];
  onDelete: (id: string) => void;
  /** Shown when there are no items */
  empty: React.ReactElement;
}

function formatDate(ms: number, language: 'en' | 'ur'): string {
  try {
    return new Date(ms).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(ms).toDateString();
  }
}

export function AnalysisList({ items, onDelete, empty }: Props) {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);

  function confirmDelete(id: string) {
    Alert.alert(t('history.deleteTitle'), t('history.deleteBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('history.delete'), style: 'destructive', onPress: () => onDelete(id) },
    ]);
  }

  if (items.length === 0) return empty;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const count = t('history.count', { count: item.colours.length });
        const date = formatDate(item.createdAt, language);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${count}, ${date}`}
            onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
            style={styles.row}
          >
            <Image source={{ uri: item.thumb }} style={styles.thumb} />
            <View style={styles.info}>
              <Text style={styles.title}>{count}</Text>
              <View style={styles.swatches}>
                {item.colours.slice(0, 6).map((c) => (
                  <View key={c.hex} style={[styles.swatch, { backgroundColor: c.hex }]} />
                ))}
              </View>
              <Text style={styles.date}>{date}</Text>
            </View>
            {item.isFavourite ? (
              <Ionicons name="heart" size={20} color={colors.primary600} />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('history.delete')}
              hitSlop={8}
              onPress={() => confirmDelete(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={22} color={colors.inkSoft} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.xl, gap: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  thumb: { width: 72, height: 72, borderRadius: radius.control, backgroundColor: colors.primary100 },
  info: { flex: 1, gap: 6 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  swatches: { flexDirection: 'row', gap: 6 },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border },
  date: { color: colors.inkSoft, fontSize: 13 },
  deleteButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

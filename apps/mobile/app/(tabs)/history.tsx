import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnalysisList } from '@/components/AnalysisList';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, TOUCH_TARGET } from '@/constants/theme';
import { clearHistory, deleteAnalysis, listAnalyses, type Analysis } from '@/lib/db';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Analysis[]>([]);

  const reload = useCallback(() => setItems(listAnalyses()), []);
  // Reload whenever the tab comes into focus so new analyses and favourite changes show up.
  useFocusEffect(reload);

  function confirmClear() {
    Alert.alert(t('history.clearTitle'), t('history.clearBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      {
        text: t('history.clear'),
        style: 'destructive',
        onPress: () => {
          clearHistory();
          reload();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('history.title')}
        right={
          items.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('history.clear')}
              onPress={confirmClear}
              style={styles.headerButton}
            >
              <Ionicons name="trash-outline" size={22} color={colors.white} />
            </Pressable>
          ) : undefined
        }
      />
      <AnalysisList
        items={items}
        onDelete={(id) => {
          deleteAnalysis(id);
          reload();
        }}
        empty={
          <EmptyState
            icon="time-outline"
            title={t('history.emptyTitle')}
            body={t('history.emptyBody')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  headerButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

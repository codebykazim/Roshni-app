import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnalysisList } from '@/components/AnalysisList';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/constants/theme';
import { deleteAnalysis, listAnalyses, type Analysis } from '@/lib/db';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Analysis[]>([]);

  const reload = useCallback(() => setItems(listAnalyses({ favouritesOnly: true })), []);
  useFocusEffect(reload);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('favorites.title')}
        right={<Text style={styles.count}>{t('favorites.saved', { count: items.length })}</Text>}
      />
      <AnalysisList
        items={items}
        onDelete={(id) => {
          deleteAnalysis(id);
          reload();
        }}
        empty={
          <EmptyState
            icon="heart-outline"
            title={t('favorites.emptyTitle')}
            body={t('favorites.emptyBody')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  count: { color: colors.primary200, fontSize: 15, fontWeight: '600' },
});

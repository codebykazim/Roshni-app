import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { analyzeImage } from '@/lib/analysis/analyzeImage';
import { useCurrentAnalysis } from '@/lib/analysis/current';
import { insertAnalysis, type AnalysisSource } from '@/lib/db';

export default function UploadScreen() {
  const { t } = useTranslation();
  const setCurrent = useCurrentAnalysis((s) => s.setCurrent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function analyse(uri: string, source: AnalysisSource) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await analyzeImage(uri);
      const saved = insertAnalysis({ source, ...result });
      setCurrent({
        id: saved.id,
        uri: result.uri,
        width: result.width,
        height: result.height,
        full: result.full,
        colours: saved.colours,
      });
      router.push('/result');
    } catch (error) {
      console.warn('analyse failed', error);
      setMessage(t('upload.error'));
    } finally {
      setBusy(false);
    }
  }

  async function pickFromGallery() {
    setMessage(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const uri = result.canceled ? null : result.assets[0]?.uri;
    if (uri) await analyse(uri, 'gallery');
  }

  async function takePhoto() {
    setMessage(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage(t('upload.cameraDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    const uri = result.canceled ? null : result.assets[0]?.uri;
    if (uri) await analyse(uri, 'camera');
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t('upload.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={pickFromGallery}
          style={styles.drop}
        >
          {busy ? (
            <>
              <ActivityIndicator size="large" color={colors.primary600} />
              <Text style={styles.dropTitle}>{t('upload.analysing')}</Text>
            </>
          ) : (
            <>
              <View style={styles.dropIcon}>
                <Ionicons name="cloud-upload-outline" size={36} color={colors.primary600} />
              </View>
              <Text style={styles.dropTitle}>{t('upload.drop')}</Text>
              <Text style={styles.dropHint}>{t('upload.dropHint')}</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.or}>{t('upload.or')}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={pickFromGallery}
          style={[styles.primaryButton, busy && styles.disabled]}
        >
          <Ionicons name="images-outline" size={20} color={colors.white} />
          <Text style={styles.primaryText}>{t('upload.gallery')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={takePhoto}
          style={[styles.secondaryButton, busy && styles.disabled]}
        >
          <Ionicons name="camera-outline" size={20} color={colors.primary700} />
          <Text style={styles.secondaryText}>{t('upload.camera')}</Text>
        </Pressable>

        {message ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {message}
          </Text>
        ) : null}
        <Text style={styles.formats}>{t('upload.formats')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, gap: space.md },
  drop: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary600,
    backgroundColor: colors.primary100,
    borderRadius: radius.card + 4,
    paddingVertical: space.xxl * 2,
    alignItems: 'center',
    gap: space.sm,
  },
  dropIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    backgroundColor: colors.primary200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropTitle: { color: colors.primary800, fontSize: 18, fontWeight: '800' },
  dropHint: { color: colors.inkSoft, fontSize: 14 },
  or: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginVertical: space.sm },
  primaryButton: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    backgroundColor: colors.primary600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    minHeight: TOUCH_TARGET + 8,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.primary300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  secondaryText: { color: colors.primary700, fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: colors.red, fontSize: 14, textAlign: 'center' },
  formats: { color: colors.inkSoft, fontSize: 13, textAlign: 'center', marginTop: space.sm },
});

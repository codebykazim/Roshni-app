import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, space, TOUCH_TARGET } from '@/constants/theme';
import { Text } from '@/components/AppText';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Tile {
  key: string;
  label: string;
  icon: IconName;
  tint: string;
  bg: string;
  /** Route to open, or undefined while the feature is not built yet. */
  onPress?: () => void;
}

function Logo() {
  return (
    <Image
      source={require('../../assets/images/logo-mark.png')}
      style={styles.logoImage}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();

  const tiles: Tile[] = [
    {
      key: 'camera',
      label: t('home.liveCamera'),
      icon: 'camera-outline',
      tint: colors.primary600,
      bg: colors.primary100,
      onPress: () => router.push('/camera'),
    },
    {
      key: 'modes',
      label: t('home.modes'),
      icon: 'eye-outline',
      tint: colors.blue,
      bg: colors.blueBg,
      onPress: () => router.push('/simulate'),
    },
    {
      key: 'history',
      label: t('home.history'),
      icon: 'time-outline',
      tint: colors.red,
      bg: colors.redBg,
      onPress: () => router.push('/history'),
    },
    {
      key: 'settings',
      label: t('home.settings'),
      icon: 'settings-outline',
      tint: colors.green,
      bg: colors.greenBg,
      onPress: () => router.push('/profile'),
    },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        leading={<Logo />}
        title={t('app.name')}
        subtitle={t('app.tagline')}
        right={
          <View style={styles.bell} accessibilityElementsHidden importantForAccessibility="no">
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="cloud-upload-outline" size={34} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>{t('home.uploadTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('home.uploadSubtitle')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/upload')}
            style={styles.heroButton}
          >
            <Text style={styles.heroButtonText}>{t('home.getStarted')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary700} />
          </Pressable>
        </View>

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('home.explore')}
        </Text>
        <View style={styles.grid}>
          {tiles.map((tile) => {
            const disabled = !tile.onPress;
            return (
              <Pressable
                key={tile.key}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                accessibilityLabel={disabled ? `${tile.label}. ${t('home.soon')}` : tile.label}
                disabled={disabled}
                onPress={tile.onPress}
                style={[styles.tile, { backgroundColor: tile.bg }, disabled && styles.tileSoon]}
              >
                <View style={[styles.tileIcon, { backgroundColor: `${tile.tint}22` }]}>
                  <Ionicons name={tile.icon} size={26} color={tile.tint} />
                </View>
                <Text style={styles.tileLabel}>{tile.label}</Text>
                {disabled ? <Text style={styles.soon}>{t('home.soon')}</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <View
          style={[styles.testCard, styles.tileSoon]}
          accessible
          accessibilityLabel={`${t('home.testTitle')}. ${t('home.soon')}`}
        >
          <View style={styles.testBadge}>
            <Ionicons name="eye" size={28} color={colors.primary300} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.testTitle}>{t('home.testTitle')}</Text>
            <Text style={styles.testSubtitle}>{t('home.testSubtitle')}</Text>
            <Text style={[styles.soon, { color: colors.primary300 }]}>{t('home.soon')}</Text>
          </View>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>💡 {t('home.didYouKnowTitle')}</Text>
          <Text style={styles.tipBody}>{t('home.didYouKnowBody')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.xl, paddingBottom: space.xxl, gap: space.lg },
  logoImage: { width: 60, height: 52 },
  bell: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: colors.primary600,
    borderRadius: radius.card + 8,
    padding: space.xxl,
    gap: space.sm,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
  heroSubtitle: { color: colors.primary100, fontSize: 16, lineHeight: 22 },
  heroButton: {
    alignSelf: 'flex-start',
    minHeight: TOUCH_TARGET,
    marginTop: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.control,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  heroButtonText: { color: colors.primary700, fontSize: 16, fontWeight: '700' },
  sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
    minHeight: 120,
  },
  tileSoon: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary300 },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  soon: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  testCard: {
    backgroundColor: colors.night,
    borderRadius: radius.card + 4,
    padding: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  testBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.control,
    backgroundColor: 'rgba(168,85,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  testSubtitle: { color: colors.primary300, fontSize: 14, lineHeight: 20, marginTop: 2 },
  tip: { backgroundColor: colors.primary50, borderRadius: radius.card, padding: space.lg, gap: 6 },
  tipTitle: { color: colors.primary700, fontSize: 16, fontWeight: '700' },
  tipBody: { color: colors.primary800, fontSize: 15, lineHeight: 22 },
});

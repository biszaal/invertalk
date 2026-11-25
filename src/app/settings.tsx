import Feather from '@expo/vector-icons/Feather';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { PRIVACY_POLICY_URL } from '@/config';
import type { ConsentRecord } from '@/game/consent';
import { readConsent } from '@/game/consentStore';
import type { IconName } from '@/ui/Button';
import { formatDate } from '@/ui/formatDate';
import { Mark } from '@/ui/Mark';
import { Screen } from '@/ui/Screen';
import { Txt } from '@/ui/Txt';
import { useTheme } from '@/ui/theme';

export default function SettingsScreen() {
  const t = useTheme();
  const [consent, setConsent] = useState<ConsentRecord | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      void readConsent().then(setConsent);
    }, [])
  );

  const config = Constants.expoConfig;
  const build = Platform.OS === 'ios' ? config?.ios?.buildNumber : config?.android?.versionCode;

  return (
    <Screen eyebrow="Settings" title="Privacy and you.">
      <Txt variant="body">Recordings stay on this phone and are deleted after each game.</Txt>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row icon="shield" label="Privacy policy" detail="biszaaltech.com" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} divider />
        <Row
          icon="mic"
          label="Recording consent"
          detail={consent === undefined ? ' ' : consent ? `Agreed on ${formatDate(consent.acceptedAt)}` : 'Not agreed yet'}
          onPress={() => router.push({ pathname: '/consent', params: { mode: 'review' } })}
        />
      </View>
      <View style={styles.about}>
        <Mark size={28} />
        <Txt variant="meta">{`Invertalk ${config?.version ?? '?'}${build ? ` (${build})` : ''}`}</Txt>
      </View>
    </Screen>
  );
}

function Row({ icon, label, detail, onPress, divider }: { icon: IconName; label: string; detail: string; onPress: () => void; divider?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && { borderBottomWidth: 1, borderBottomColor: t.border }, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: t.selectedBg }]}>
        <Feather name={icon} size={17} color={t.text} />
      </View>
      <View style={styles.rowText}>
        <Txt variant="label">{label}</Txt>
        <Txt variant="meta">{detail}</Txt>
      </View>
      <Feather name="chevron-right" size={18} color={t.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 16 },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 3 },
  pressed: { opacity: 0.7 },
  about: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16 },
});

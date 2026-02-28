/**
 * WelcomeScreen — habFitt pre-login landing page.
 *
 * "Electric Momentum" design theme.
 * Dark (#141414) base, orange gradient accents, zero guilt tone.
 *
 * Scroll sections:
 *  1. Hero
 *  2. Pain points
 *  3. Value grid
 *  4. Differentiator (gradient bg)
 *  5. Testimonials (horizontal FlatList)
 *  6. Community
 *  7. Final CTA + footer
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors } from '../theme/colors';
import LogoMark from '../components/LogoMark';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Static data ──────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    id: '1',
    icon: '⚡',
    title: "Can't Stay Consistent",
    body: 'Life gets busy. Habits disappear. You start strong, then it all falls apart.',
  },
  {
    id: '2',
    icon: '🌀',
    title: 'Information Overload',
    body: 'Paralyzed by conflicting advice on what to eat and how to live healthier.',
  },
  {
    id: '3',
    icon: '🔥',
    title: 'Always Running on Empty',
    body: "No energy left for yourself after everything else. You've put yourself last.",
  },
];

const VALUE_CARDS = [
  { id: '1', icon: '⚡', title: 'Feel Energetic Daily', body: 'Consistent energy, no crashes' },
  { id: '2', icon: '🌿', title: 'Build Daily Habits', body: 'Simple systems that stick even when life gets hectic' },
  { id: '3', icon: '🥗', title: 'Eat for Your Body', body: 'Clear, calm guidance on food — no confusion' },
  { id: '4', icon: '🧠', title: 'Reduce Decision Fatigue', body: 'One clear action a day. No overwhelm.' },
];

const WINS = [
  'Systems, not rules',
  'Built for real, busy lives',
  'No willpower required',
  'Personalised to you',
  'Results in the first week',
];

const ANTI = [
  'No quick fixes or fads',
  'No copy-paste programs',
  'No guilt, no perfection',
];

const TESTIMONIALS = [
  {
    id: '1',
    quote: '"Meaningful shifts in my health and energy within the first week. I didn\u2019t expect it to happen so fast."',
    name: 'Sarah, 34',
    role: 'Marketing Manager',
  },
  {
    id: '2',
    quote: '"Finally something that works for my actual life — not the ideal version of it. No more guilt, just progress."',
    name: 'James, 41',
    role: 'Product Director',
  },
  {
    id: '3',
    quote: '"I stopped relying on willpower. habFitt helped me build systems. Three months in and it just feels natural."',
    name: 'Priya, 38',
    role: 'Consultant',
  },
];

const AVATAR_LETTERS = ['S', 'J', 'P', 'M'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradientButton({ label, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBtn}
      >
        <Text style={styles.gradientBtnText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function SectionLabel({ text }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function PainCard({ item }) {
  return (
    <View style={styles.painCard}>
      <Text style={styles.painIcon}>{item.icon}</Text>
      <View style={styles.painCardContent}>
        <Text style={styles.painCardTitle}>{item.title}</Text>
        <Text style={styles.painCardBody}>{item.body}</Text>
      </View>
    </View>
  );
}

function ValueCard({ item }) {
  return (
    <View style={styles.valueCard}>
      <Text style={styles.valueIcon}>{item.icon}</Text>
      <Text style={styles.valueTitle}>{item.title}</Text>
      <Text style={styles.valueBody}>{item.body}</Text>
    </View>
  );
}

function StarRow() {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={styles.star}>★</Text>
      ))}
    </View>
  );
}

function TestimonialCard({ item }) {
  return (
    <View style={[styles.testimonialCard, { width: SCREEN_W - 48 }]}>
      <StarRow />
      <Text style={styles.testimonialQuote}>{item.quote}</Text>
      <Text style={styles.testimonialAttrib}>
        {item.name} · {item.role}
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function WelcomeScreen({ navigation }) {
  const [activeDot, setActiveDot] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveDot(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* ── Sticky header ─────────────────────────────────── */}
      <View style={styles.header}>
        <LogoMark size="md" />
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Log in"
        >
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. HERO ───────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroH1}>
            Build the habit of{'\n'}feeling good.
          </Text>
          <Text style={styles.heroSubtitle}>
            For busy professionals who want energy and consistency — without burning out.
          </Text>

          <GradientButton
            label="⚡  Get Started — It's Free"
            onPress={() => navigation.navigate('Register')}
            style={styles.heroCTA}
          />

          <TouchableOpacity
            onPress={() => {}}
            accessibilityLabel="See how it works"
          >
            <Text style={styles.secondaryCTA}>See How It Works ↓</Text>
          </TouchableOpacity>

          <View style={styles.socialProofRow}>
            <View style={styles.proofDot} />
            <Text style={styles.socialProofText}>100+ professionals already inside</Text>
          </View>
        </View>

        {/* ── 2. PAIN ───────────────────────────────────────── */}
        <View style={styles.sectionSecondary}>
          <SectionLabel text="SOUND FAMILIAR?" />
          {PAIN_POINTS.map((item) => (
            <PainCard key={item.id} item={item} />
          ))}
          <View style={styles.brandQuote}>
            <View style={styles.brandQuoteLine} />
            <Text style={styles.brandQuoteText}>
              "You're not alone. There's a path forward."
            </Text>
          </View>
        </View>

        {/* ── 3. VALUE GRID ─────────────────────────────────── */}
        <View style={styles.sectionPrimary}>
          <Text style={styles.sectionHeading}>What you'll{'\n'}experience</Text>
          <View style={styles.valueGrid}>
            {VALUE_CARDS.map((item) => (
              <ValueCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* ── 4. DIFFERENTIATOR (gradient bg) ───────────────── */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.diffSection}
        >
          <Text style={styles.diffHeading}>
            This isn't another{'\n'}wellness app.
          </Text>
          <Text style={styles.diffSubLabel}>WHAT MAKES HABFITT DIFFERENT</Text>
          {WINS.map((w) => (
            <Text key={w} style={styles.diffWin}>✅  {w}</Text>
          ))}
          <View style={styles.diffDivider} />
          <Text style={styles.diffSubLabel}>WHAT WE LEAVE BEHIND</Text>
          {ANTI.map((a) => (
            <Text key={a} style={styles.diffAnti}>❌  {a}</Text>
          ))}
        </LinearGradient>

        {/* ── 5. TESTIMONIALS ──────────────────────────────── */}
        <View style={styles.sectionSecondary}>
          <Text style={styles.sectionHeading}>What members say</Text>
          <FlatList
            ref={flatListRef}
            data={TESTIMONIALS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TestimonialCard item={item} />}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            style={styles.testimonialList}
          />
          {/* Dot navigation */}
          <View style={styles.dotRow}>
            {TESTIMONIALS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => flatListRef.current?.scrollToIndex({ index: i })}
                accessibilityLabel={`Testimonial ${i + 1}`}
              >
                <View style={[styles.dot, i === activeDot && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 6. COMMUNITY ─────────────────────────────────── */}
        <View style={styles.sectionPrimary}>
          <View style={styles.communityCard}>
            <Text style={styles.communityIcon}>🌿</Text>
            <Text style={styles.communityHeading}>Join the Habit Circle</Text>
            <Text style={styles.communityBody}>
              A safe space to ask health questions, stay accountable, and feel supported — daily.
            </Text>
            <View style={styles.avatarRow}>
              {AVATAR_LETTERS.map((letter, i) => (
                <LinearGradient
                  key={i}
                  colors={gradientColors}
                  style={[styles.avatar, { marginLeft: i === 0 ? 0 : -8 }]}
                >
                  <Text style={styles.avatarText}>{letter}</Text>
                </LinearGradient>
              ))}
              <Text style={styles.avatarCount}>
                {'  '}<Text style={styles.avatarCountBold}>100+</Text> professionals inside
              </Text>
            </View>
          </View>
        </View>

        {/* ── 7. FINAL CTA ─────────────────────────────────── */}
        <View style={[styles.sectionPrimary, styles.finalCtaSection]}>
          <Text style={styles.finalHeading}>Ready to feel like{'\n'}yourself again?</Text>
          <Text style={styles.trustSignals}>
            Free to join  ·  Instant access{'\n'}No willpower required
          </Text>
          <GradientButton
            label="⚡  Get Started — It's Free"
            onPress={() => navigation.navigate('Register')}
            style={styles.heroCTA}
          />
          <View style={styles.loginLinkRow}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>habFitt © 2026  ·  Privacy  ·  Terms</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  loginBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 44,
    justifyContent: 'center',
  },
  loginBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Hero
  heroSection: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 56,
  },
  heroH1: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 14,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 36,
  },
  heroCTA: {
    width: '100%',
    marginBottom: 20,
  },
  gradientBtn: {
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryCTA: {
    color: colors.textAccent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  proofDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textAccent,
  },
  socialProofText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Section containers
  sectionPrimary: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  sectionSecondary: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: colors.textAccent,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 24,
    lineHeight: 34,
  },

  // Pain cards
  painCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 12,
  },
  painIcon: { fontSize: 28, lineHeight: 34 },
  painCardContent: { flex: 1 },
  painCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  painCardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  brandQuote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  brandQuoteLine: {
    width: 3,
    height: '100%',
    backgroundColor: colors.textAccent,
    borderRadius: 2,
    minHeight: 40,
  },
  brandQuoteText: {
    flex: 1,
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 24,
  },

  // Value grid
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valueCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 18,
    width: '47%',
    gap: 8,
  },
  valueIcon: { fontSize: 28, lineHeight: 34 },
  valueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  valueBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Differentiator
  diffSection: {
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  diffHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 28,
  },
  diffSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 14,
  },
  diffWin: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 22,
  },
  diffDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 24,
  },
  diffAnti: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 10,
    lineHeight: 22,
  },

  // Testimonials
  testimonialList: { marginHorizontal: -24 },
  testimonialCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 6,
  },
  starRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  star: { color: colors.textAccent, fontSize: 18 },
  testimonialQuote: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  testimonialAttrib: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  dotActive: {
    width: 20,
    borderRadius: 4,
    backgroundColor: colors.textAccent,
  },

  // Community
  communityCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 28,
  },
  communityIcon: { fontSize: 36, marginBottom: 12 },
  communityHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  communityBody: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgSecondary,
  },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  avatarCount: { fontSize: 14, color: colors.textSecondary, marginLeft: 12 },
  avatarCountBold: { color: colors.textPrimary, fontWeight: '700' },

  // Final CTA
  finalCtaSection: { alignItems: 'center' },
  finalHeading: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 12,
  },
  trustSignals: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: { color: colors.textSecondary, fontSize: 14 },
  loginLink: { color: colors.textAccent, fontWeight: '600', fontSize: 14 },

  // Footer
  footer: {
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 0,
    alignItems: 'center',
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    width: '100%',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

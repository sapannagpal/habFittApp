/**
 * WeightUnitScreen — Bottom-sheet-style modal for selecting kg or lbs.
 * Presented as a modal over the previous screen.
 *
 * Navigation: navigate('WeightUnit') to open,
 *             navigation.goBack() to close.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradientColors } from '../theme/colors';
import { useWeightUnit } from '../hooks/useWeightUnit';
import GradientButton from '../components/common/GradientButton';

const OPTIONS = [
  { id: 'kg',  label: 'Kilograms', suffix: '(kg)' },
  { id: 'lbs', label: 'Pounds',    suffix: '(lbs)' },
];

export default function WeightUnitScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { weightUnit, setWeightUnit } = useWeightUnit();
  const [selected, setSelected] = useState(weightUnit);

  const handleSave = () => {
    setWeightUnit(selected);
    navigation.goBack();
  };

  return (
    <View style={styles.overlay}>
      {/* Tappable backdrop */}
      <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <Text style={styles.title}>Weight Unit</Text>

        {OPTIONS.map(opt => {
          const isSelected = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setSelected(opt.id)}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient
                  colors={gradientColors}
                  style={styles.optionInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="radio-button-on" size={20} color="#fff" />
                  <Text style={[styles.optionText, styles.optionTextSelected]}>
                    {opt.label} {opt.suffix}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.optionInner}>
                  <Ionicons
                    name="radio-button-off-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.optionText}>
                    {opt.label} {opt.suffix}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <GradientButton label="Save" onPress={handleSave} style={styles.saveBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  panel: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  option: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  optionSelected: {
    borderColor: colors.gradientMid,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 16,
  },
});

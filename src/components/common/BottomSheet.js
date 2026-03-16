/**
 * BottomSheet — Animated slide-up modal sheet.
 *
 * Props:
 *   visible     {boolean}    — controls modal visibility
 *   onDismiss   {function}   — called after the sheet has animated out
 *   children    {ReactNode}  — content rendered inside the sheet
 *   snapHeight  {number}     — optional fixed height; if omitted, content-sized up to 90% screen
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { colors } from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const OPEN_DURATION = 300;
const CLOSE_DURATION = 250;

export function BottomSheet({ visible, onDismiss, children, snapHeight }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Animate the sheet in/out when visible changes
  useEffect(() => {
    if (visible) {
      // Reset to offscreen before animating in so position is always correct
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      // Programmatic close: animate out, then reset for the next open
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: CLOSE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        translateY.setValue(SCREEN_HEIGHT);
      });
    }
  }, [visible, translateY]);

  // Animate out then call onDismiss
  const handleDismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: CLOSE_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Reset position so it's ready for next open
      translateY.setValue(SCREEN_HEIGHT);
      onDismiss();
    });
  }, [translateY, onDismiss]);

  const sheetStyle = snapHeight
    ? { height: snapHeight }
    : { maxHeight: SCREEN_HEIGHT * 0.9 };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Full-screen backdrop — tapping it dismisses the sheet */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Animated sheet panel */}
      <Animated.View
        style={[
          styles.sheet,
          sheetStyle,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Drag handle pill */}
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Ensure the sheet renders above the backdrop
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
});

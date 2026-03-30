import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { BUBBLE_SIZE, SCREEN_HEIGHT, BUBBLE_COLORS, FONT_SCALE } from '../constants';

const useNative = Platform.OS !== 'web';

export interface BubbleData {
  id: string;
  letter: string;
  x: number;
  color: string;
  speed: number;
  selected?: boolean;
}

interface BubbleProps {
  data: BubbleData;
  onPress: (id: string) => void;
  shouldStop?: boolean;
  highlight?: boolean;
}

export default function Bubble({ data, onPress, shouldStop, highlight }: BubbleProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + BUBBLE_SIZE)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: useNative,
    }).start();

    // Float upward
    const targetY = shouldStop
      ? SCREEN_HEIGHT * 0.1 + Math.random() * (SCREEN_HEIGHT * 0.6)
      : -BUBBLE_SIZE * 2;

    Animated.timing(translateY, {
      toValue: targetY,
      duration: data.speed,
      useNativeDriver: useNative,
    }).start();

    // Gentle wobble
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 8,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: useNative,
        }),
        Animated.timing(wobble, {
          toValue: -8,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: useNative,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    // Pop animation
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: useNative,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: useNative,
      }),
    ]).start(() => {
      onPress(data.id);
    });
  };

  // Extra padding around the bubble so taps near the edge still register
  const extraHit = Math.round(BUBBLE_SIZE * 0.25);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: data.x - extraHit,
        width: BUBBLE_SIZE + extraHit * 2,
        height: BUBBLE_SIZE + extraHit * 2,
        transform: [{ translateY }, { translateX: wobble }, { scale }],
        opacity,
      }}
    >
      <TouchableWithoutFeedback
        onPress={handlePress}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <View
          style={[
            styles.bubble,
            {
              marginTop: extraHit,
              marginLeft: extraHit,
              backgroundColor: data.color,
              borderWidth: highlight ? 3 : 0,
              borderColor: highlight ? '#FFD700' : 'transparent',
            },
            data.selected && styles.selected,
          ]}
        >
          <View style={styles.shine} />
          <Text style={styles.letter}>{data.letter}</Text>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  shine: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  letter: {
    fontSize: Math.round(34 * FONT_SCALE),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

// Track recent X positions to spread bubbles out
let recentXSlots: number[] = [];

export function createBubble(letter: string, id?: string): BubbleData {
  const screenW = require('react-native').Dimensions.get('window').width;
  const padding = BUBBLE_SIZE * 0.6;
  const usable = screenW - padding * 2;

  // Divide screen into columns and pick one that wasn't recently used
  const cols = Math.floor(usable / (BUBBLE_SIZE + 10));
  const slotWidth = usable / cols;
  const available = Array.from({ length: cols }, (_, i) => i)
    .filter(i => !recentXSlots.includes(i));
  const slot = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : Math.floor(Math.random() * cols);

  recentXSlots.push(slot);
  if (recentXSlots.length > Math.max(2, Math.floor(cols / 2))) {
    recentXSlots.shift();
  }

  // Add a little jitter within the slot so it's not perfectly grid-aligned
  const jitter = (Math.random() - 0.5) * slotWidth * 0.3;
  const x = padding + slot * slotWidth + slotWidth / 2 - BUBBLE_SIZE / 2 + jitter;

  return {
    id: id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    letter,
    x: Math.max(4, Math.min(x, screenW - BUBBLE_SIZE - 4)),
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    speed: 5000 + Math.random() * 3000,
  };
}

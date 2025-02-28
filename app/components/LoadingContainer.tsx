import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const LoadingContainer = () => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.Image
        source={require('@/assets/images/loading-icon.png')}
        style={[styles.loadingIcon, { transform: [{ rotate }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 50,
    height: 50,
  },
});

export default LoadingContainer;

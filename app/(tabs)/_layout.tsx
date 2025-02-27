import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Colors from '../constants/Colors';
import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import {
  HomeIcon,
  MapIcon,
  ShoppingBagIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserCircleIcon,
} from 'react-native-heroicons/outline';

const TAB_ICONS = {
  index: HomeIcon,
  map: MapIcon,
  cart: ShoppingBagIcon,
  messages: ChatBubbleOvalLeftEllipsisIcon,
  profile: UserCircleIcon,
};

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const translateValue = useRef(new Animated.Value(0)).current;
  const tabWidth = (Dimensions.get('window').width - 40) / state.routes.length;

  useEffect(() => {
    Animated.spring(translateValue, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Colors.white,
          borderRadius: 100,
          marginHorizontal: 20,
          width: Dimensions.get('window').width - 40,
          height: 64,
          justifyContent: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: 7,
            left: 0,
            width: tabWidth,
            alignItems: 'center',
            transform: [{ translateX: translateValue }],
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: Colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Animated.View>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const IconComponent = TAB_ICONS[route.name as keyof typeof TAB_ICONS];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent
                size={24}
                color={isFocused ? Colors.white : Colors.gray600}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

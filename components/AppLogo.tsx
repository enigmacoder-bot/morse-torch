import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

const AppLogo = () => {
  return (
    <View style={styles.container}>
      <Svg width="60" height="60" viewBox="0 0 100 100">
        <Rect width="100" height="100" rx="20" fill="#262626"/>
        <Path d="M38 70 L38 85 L62 85 L62 70 L55 70 L55 65 L45 65 L45 70 Z" fill="#F5F5F5"/>
        <Rect x="20" y="45" width="18" height="7" fill="#FDD835"/>
        <Rect x="41" y="45" width="18" height="7" fill="#FDD835"/>
        <Rect x="62" y="45" width="18" height="7" fill="#FDD835"/>
        <Circle cx="30" cy="25" r="4" fill="#FDD835"/>
        <Circle cx="50" cy="25" r="4" fill="#FDD835"/>
        <Circle cx="70" cy="25" r="4" fill="#FDD835"/>
      </Svg>
    </View>
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
  },
});
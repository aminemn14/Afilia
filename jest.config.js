module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!' +
      [
        'react-native',
        '@react-native',
        '@react-native-community',
        '@react-native\\/js-polyfills',
        'expo',
        '@expo',
        'expo-modules-core',
        'moti',
        'expo-router',
      ].join('|') +
      ')/',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  setupFiles: [
    '<rootDir>/jest.setup.js',
    'react-native-gesture-handler/jestSetup.js',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

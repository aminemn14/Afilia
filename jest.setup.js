jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: 'https://mock-api.local',
    },
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = (props) => React.createElement('Icon', props);
  return { Ionicons: MockIcon };
});

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;

const apiConfig = {
  baseURL: extra?.apiBaseUrl,
};

export default apiConfig;

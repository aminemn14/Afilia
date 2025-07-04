import 'dotenv/config';

export default {
  expo: {
    name: 'Afilia',
    slug: 'afilia',
    version: '1.0.3',
    owner: 'aminemn14',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    android: {
      package: 'com.kodio.afilia',
      versionCode: 1,
    },
    ios: {
      bundleIdentifier: 'com.kodio.afilia',
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'Permet de sélectionner une photo de profil ou de partager des images dans les événements.',
        NSLocationWhenInUseUsageDescription:
          'Nous avons besoin de votre position pour afficher les événements autour de vous.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Nous utilisons votre position même en arrière-plan pour vous montrer où vous êtes sur la carte.',
      },
    },
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      url: 'https://u.expo.dev/6a691b60-e448-4b42-a5ed-801356d8c5ec',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      eas: {
        projectId: '6a691b60-e448-4b42-a5ed-801356d8c5ec',
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
  },
};

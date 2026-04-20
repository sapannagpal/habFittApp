/**
 * HabFitt Expo app config.
 *
 * Replaces app.json — Expo reads this file first when it exists.
 * APP_ENV is injected from the shell environment and forwarded into
 * `extra` so the app can access it via Constants.expoConfig.extra.APP_ENV.
 *
 * Start commands:
 *   APP_ENV=dev  npx expo start        (default — same as plain expo start)
 *   APP_ENV=uat  npx expo start --ios
 *   APP_ENV=prod npx expo start --ios
 */

const APP_ENV = process.env.APP_ENV ?? 'dev';

export default {
  expo: {
    name:        'habFittApp',
    slug:        'habfittapp',
    version:     '1.0.0',
    orientation: 'portrait',
    icon:        './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode:      'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage:  './assets/adaptive-icon.png',
        backgroundColor:  '#ffffff',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      APP_ENV,
    },
  },
};

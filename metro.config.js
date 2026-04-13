// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo SDK 54 enables package exports resolution by default, but with an empty
// conditionNames list Metro falls through to the `import` condition on packages
// like zustand — resolving their .mjs files which use `import.meta`. That syntax
// crashes the web bundle because Metro serves it as CommonJS, not an ES module.
//
// Explicitly setting conditionNames forces Metro to prefer the `react-native`
// (CJS) and `require` conditions over `import`, fixing the SyntaxError.
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = config;

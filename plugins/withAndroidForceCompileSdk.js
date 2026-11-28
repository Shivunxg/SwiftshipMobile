const { withProjectBuildGradle } = require('@expo/config-plugins');

// Forces all Android subprojects (react-native-screens etc.) to use compileSdk 37.
// Uses pluginManager.withPlugin() — the Gradle 9 compatible hook; afterEvaluate is
// forbidden once the root project is in configured state.
module.exports = function withAndroidForceCompileSdk(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const marker = '// withAndroidForceCompileSdk';
      if (!config.modResults.contents.includes(marker)) {
        config.modResults.contents += `
${marker}
subprojects {
    pluginManager.withPlugin("com.android.library") {
        android {
            compileSdk 37
        }
    }
    pluginManager.withPlugin("com.android.application") {
        android {
            compileSdk 37
        }
    }
}
`;
      }
    }
    return config;
  });
};

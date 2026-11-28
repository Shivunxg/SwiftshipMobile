const { withProjectBuildGradle } = require('@expo/config-plugins');

// Forces all Android subprojects (react-native-screens etc.) to use compileSdk 37.
// expo-build-properties only sets it for :app; third-party libs hardcode their own value.
module.exports = function withAndroidForceCompileSdk(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const marker = '// withAndroidForceCompileSdk';
      if (!config.modResults.contents.includes(marker)) {
        config.modResults.contents += `
${marker}
subprojects {
    afterEvaluate { project ->
        if (project.plugins.hasPlugin('com.android.library') ||
            project.plugins.hasPlugin('com.android.application')) {
            project.android {
                compileSdk 37
            }
        }
    }
}
`;
      }
    }
    return config;
  });
};

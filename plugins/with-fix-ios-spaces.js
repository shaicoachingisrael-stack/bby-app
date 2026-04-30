/**
 * Expo config plugin: fix Xcode build phase shell scripts that break when the
 * project realpath contains a space (e.g. /Volumes/1To stock/...).
 *
 * Runs during `expo prebuild`. Idempotent. Safe to keep enabled forever.
 *
 * Patches:
 *   1. ios/<App>.xcodeproj/project.pbxproj — "Bundle React Native code and
 *      images" phase: replace unquoted backtick command substitution with a
 *      quoted variable assignment + invocation.
 *   2. ios/Pods/Pods.xcodeproj/project.pbxproj — EXConstants
 *      "[CP-User] Generate app.config..." phase: wrap the inner double-quoted
 *      path in single quotes so /bin/sh doesn't strip them before bash sees
 *      the command.
 *   3. node_modules/expo-constants/ios/EXConstants.podspec — same fix at the
 *      podspec source level so Pods regeneration produces the safe form.
 *   4. Adds a Podfile post_install hook that re-applies (1) and (2) after
 *      every `pod install` (which `expo prebuild` triggers). This makes the
 *      fix self-healing even if someone runs `pod install` manually later.
 *
 * Configure in app.json:
 *   "plugins": [..., "./plugins/with-fix-ios-spaces"]
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PODFILE_HOOK_MARKER = '# fix-ios-spaces post_install';
const PODFILE_HOOK_BLOCK = `
    ${PODFILE_HOOK_MARKER}
    # Fix Xcode shell scripts that break when project realpath contains spaces.
    # See plugins/with-fix-ios-spaces.js (Expo config plugin) and
    # scripts/fix-ios-spaces.rb. Idempotent.
    require_relative '../scripts/fix-ios-spaces'
    run!(__dir__)`;

function patchPodfile(podfilePath) {
  let podfile = fs.readFileSync(podfilePath, 'utf8');
  if (podfile.includes(PODFILE_HOOK_MARKER)) {
    return false;
  }
  // Insert before the closing 'end' of the post_install block.
  const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(\n  end\n)/;
  if (!postInstallRegex.test(podfile)) {
    // No existing post_install; append a minimal one before final `end`.
    podfile = podfile.replace(
      /\nend\s*$/,
      `\n  post_install do |installer|${PODFILE_HOOK_BLOCK}\n  end\nend\n`
    );
  } else {
    podfile = podfile.replace(postInstallRegex, `$1${PODFILE_HOOK_BLOCK}$2`);
  }
  fs.writeFileSync(podfilePath, podfile);
  return true;
}

function patchMainProjectPbxproj(pbxprojPath) {
  let contents = fs.readFileSync(pbxprojPath, 'utf8');
  // Buggy line as it appears inside the pbxproj string literal.
  const bad =
    "`\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"`";
  const good =
    "REACT_NATIVE_XCODE_SH=\\\"$(\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\")\\\"\\n\\\"$REACT_NATIVE_XCODE_SH\\\"";
  if (contents.includes(good)) return false;
  if (!contents.includes(bad)) return false;
  contents = contents.replace(bad, good);
  fs.writeFileSync(pbxprojPath, contents);
  return true;
}

function patchPodsPbxproj(pbxprojPath) {
  if (!fs.existsSync(pbxprojPath)) return false;
  let contents = fs.readFileSync(pbxprojPath, 'utf8');
  const bad =
    'shellScript = "bash -l -c \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"";';
  const good =
    'shellScript = "bash -l -c \'\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"\'";';
  if (contents.includes(good)) return false;
  if (!contents.includes(bad)) return false;
  contents = contents.replace(bad, good);
  fs.writeFileSync(pbxprojPath, contents);
  return true;
}

function patchExpoConstantsPodspec(projectRoot) {
  const podspecPath = path.join(
    projectRoot,
    'node_modules',
    'expo-constants',
    'ios',
    'EXConstants.podspec'
  );
  if (!fs.existsSync(podspecPath)) return false;
  let contents = fs.readFileSync(podspecPath, 'utf8');
  const bad =
    ':script => "bash -l -c \\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",';
  const good =
    ':script => "bash -l -c \'#{env_vars}\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"\'",';
  if (contents.includes(good)) return false;
  if (!contents.includes(bad)) return false;
  contents = contents.replace(bad, good);
  fs.writeFileSync(podspecPath, contents);
  return true;
}

const withFixIosSpaces = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot; // .../ios

      // Patch source-level expo-constants podspec so future pod installs
      // produce the safe form natively.
      const podspecPatched = patchExpoConstantsPodspec(projectRoot);
      if (podspecPatched) {
        console.log('[with-fix-ios-spaces] Patched node_modules/expo-constants/ios/EXConstants.podspec');
      }

      // Patch the main app project's pbxproj.
      const xcodeprojDir = fs
        .readdirSync(platformRoot)
        .find((f) => f.endsWith('.xcodeproj'));
      if (xcodeprojDir) {
        const mainPbx = path.join(platformRoot, xcodeprojDir, 'project.pbxproj');
        if (fs.existsSync(mainPbx) && patchMainProjectPbxproj(mainPbx)) {
          console.log(`[with-fix-ios-spaces] Patched ${xcodeprojDir}/project.pbxproj`);
        }
      }

      // Patch Pods.xcodeproj if it already exists (it usually doesn't yet at
      // this point during prebuild — pod install happens AFTER config plugins
      // run, so the Podfile post_install hook below is what actually patches
      // Pods.xcodeproj).
      const podsPbx = path.join(platformRoot, 'Pods', 'Pods.xcodeproj', 'project.pbxproj');
      if (patchPodsPbxproj(podsPbx)) {
        console.log('[with-fix-ios-spaces] Patched Pods/Pods.xcodeproj/project.pbxproj');
      }

      // Inject post_install hook into Podfile so the Pods.xcodeproj patch
      // (and re-patch of the main pbxproj) happens after every `pod install`.
      const podfilePath = path.join(platformRoot, 'Podfile');
      if (fs.existsSync(podfilePath) && patchPodfile(podfilePath)) {
        console.log('[with-fix-ios-spaces] Injected post_install hook into Podfile');
      }

      return cfg;
    },
  ]);
};

module.exports = withFixIosSpaces;

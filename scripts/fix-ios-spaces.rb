# scripts/fix-ios-spaces.rb
#
# Patches Xcode build phase shell scripts that break when the project's
# realpath contains a space (e.g. /Volumes/1To stock/...).
#
# Two known offenders ship in the default Expo SDK 54 / RN 0.81 templates:
#
# 1. ios/Bodybyyou.xcodeproj/project.pbxproj — "Bundle React Native code and
#    images" phase uses an unquoted backtick command substitution to invoke
#    react-native-xcode.sh, which word-splits on spaces.
#
# 2. ios/Pods/Pods.xcodeproj/project.pbxproj — EXConstants
#    "[CP-User] Generate app.config for prebuilt Constants.manifest" phase
#    runs `bash -l -c "$PODS_TARGET_SRCROOT/../scripts/...`
#    where the inner double quotes are eaten by /bin/sh and then bash
#    word-splits the unquoted path.
#
# This script is invoked from the Podfile's post_install hook so the patch is
# re-applied automatically every time `pod install` runs (which `expo prebuild`
# also triggers).
#
# Idempotent: running multiple times is safe.

require 'pathname'

def fix_main_project_pbxproj!(ios_dir)
  pbx = Pathname.new(File.join(ios_dir, 'Bodybyyou.xcodeproj', 'project.pbxproj'))
  return unless pbx.exist?

  contents = pbx.read

  # The buggy form (escaped as it appears inside the pbxproj string literal):
  #   `\"$NODE_BINARY\" --print \"...react-native-xcode.sh'\"`
  bad = '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`'
  good = 'REACT_NATIVE_XCODE_SH=\\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"\\n\\"$REACT_NATIVE_XCODE_SH\\"'

  if contents.include?(bad)
    contents = contents.sub(bad, good)
    pbx.write(contents)
    puts '[fix-ios-spaces] Patched Bodybyyou.xcodeproj "Bundle React Native code and images" phase.'
  elsif contents.include?(good)
    puts '[fix-ios-spaces] Bodybyyou.xcodeproj already patched.'
  else
    puts '[fix-ios-spaces] WARNING: Bodybyyou.xcodeproj bundle phase did not match known pattern; skipped.'
  end
end

def fix_pods_pbxproj!(ios_dir)
  pbx = Pathname.new(File.join(ios_dir, 'Pods', 'Pods.xcodeproj', 'project.pbxproj'))
  return unless pbx.exist?

  contents = pbx.read

  # The buggy form (as it appears in the pbxproj string literal):
  #   shellScript = "bash -l -c \"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"";
  bad = 'shellScript = "bash -l -c \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"";'
  good = 'shellScript = "bash -l -c \'\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"\'";'

  if contents.include?(bad)
    contents = contents.sub(bad, good)
    pbx.write(contents)
    puts '[fix-ios-spaces] Patched Pods.xcodeproj EXConstants get-app-config-ios.sh phase.'
  elsif contents.include?(good)
    puts '[fix-ios-spaces] Pods.xcodeproj EXConstants phase already patched.'
  else
    puts '[fix-ios-spaces] NOTE: Pods.xcodeproj EXConstants phase did not match known pattern; skipped.'
  end
end

def fix_expo_constants_podspec!(ios_dir)
  # Patch node_modules/expo-constants/ios/EXConstants.podspec so that if pods
  # are regenerated (e.g. by `pod install`), the resulting pbxproj line is
  # already in the safe form and doesn't need post_install rewriting. This
  # however only survives until `npm install` overwrites node_modules — for
  # that, see patch-package or just rely on the pbxproj rewrite above.
  podspec = Pathname.new(File.join(ios_dir, '..', 'node_modules', 'expo-constants', 'ios', 'EXConstants.podspec'))
  return unless podspec.exist?

  contents = podspec.read
  bad = ':script => "bash -l -c \'#{env_vars}\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"\'",'
  # The default form from the package may also be:
  alt_bad = ':script => "bash -l -c \"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\"",'
  if contents.include?(alt_bad)
    contents = contents.sub(alt_bad, bad)
    podspec.write(contents)
    puts '[fix-ios-spaces] Patched node_modules/expo-constants/ios/EXConstants.podspec.'
  end
end

def run!(ios_dir)
  puts '[fix-ios-spaces] Running space-safe shell script patches...'
  fix_expo_constants_podspec!(ios_dir)
  fix_main_project_pbxproj!(ios_dir)
  fix_pods_pbxproj!(ios_dir)
  puts '[fix-ios-spaces] Done.'
end

# When invoked directly (`ruby scripts/fix-ios-spaces.rb`), assume cwd-based ios dir.
if __FILE__ == $PROGRAM_NAME
  ios = ARGV[0] || File.expand_path('../ios', __dir__)
  run!(ios)
end

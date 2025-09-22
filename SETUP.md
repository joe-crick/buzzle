# React Native Sync Vibrate App Setup

This scaffold provides a complete React Native app structure for synchronized vibration between two Android phones.

## Project Structure

```
├── App.js                          # Main app entry point
├── components/
│   ├── RoleSelector.js             # Device role selection UI
│   ├── MasterComponent.js          # Master device interface
│   └── ClientComponent.js          # Client device interface
├── services/
│   ├── WebSocketService.js         # WebSocket communication
│   ├── VibrationService.js         # Vibration control
│   └── TimingService.js            # Synchronization timing
├── utils/
│   ├── messageTypes.js             # WebSocket message definitions
│   └── timingCalculations.js       # Timing utility functions
└── android/
    └── app/src/main/AndroidManifest.xml  # Android permissions
```

## Features Implemented

✅ **Master/Client Architecture** - One device controls timing, others follow
✅ **WebSocket Communication** - Real-time message exchange
✅ **Timing Synchronization** - Latency compensation and clock sync
✅ **Vibration Patterns** - Precise vibration scheduling
✅ **Permission Handling** - Android vibration permissions
✅ **Session Management** - Start/stop synchronized sessions

## Next Steps for Development

1. **Set up React Native environment:**
   ```bash
   npx react-native init SyncVibrateApp
   # Copy these files into your new project
   ```

2. **Install pnpm and project dependencies:**
   - Install pnpm (if you don't have it): https://pnpm.io/installation
   - Install dependencies for this project:
   ```bash
   pnpm install
   ```
   - Add additional packages (example):
   ```bash
   pnpm add @react-native-async-storage/async-storage react-native-permissions
   ```

3. **WebSocket Server:**
   You'll need a WebSocket server that both devices can connect to. Options:
   - Use one device as WebSocket server
   - Deploy simple Node.js WebSocket server
   - Use WebRTC for peer-to-peer (future enhancement)

4. **Test on devices:**
   ```bash
   npx react-native run-android
   ```

## Run on Android Emulator (AVD)

Follow these steps to run the app on an Android emulator using Android Studio.

1) Prerequisites
- Android Studio (latest stable) with Android SDK Platform 33 or 34 and Google APIs.
- Java Development Kit (JDK) 17 is recommended (Temurin/Adoptium works well).
- Android SDK command line tools (installed via Android Studio > SDK Manager).

2) Set environment variables
- macOS/Linux (add to your shell profile):
  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"   # macOS (or $HOME/Android/Sdk on Linux)
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  ```
- Windows (PowerShell profile):
  ```powershell
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  $env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;" + $env:Path
  ```

3) Create an emulator (AVD)
- Open Android Studio > Device Manager > Create device.
- Pick a Pixel device, select a recent image (e.g., Android 13/33), and finish.

4) Start the emulator
- From Android Studio (Device Manager) click the Play button, or run from terminal:
  ```bash
  emulator -list-avds
  emulator @YourAvdName
  ```

5) Install dependencies and start Metro bundler
```bash
pnpm install
pnpm start
```

6) Build and run the app on the emulator
- In a new terminal (with the emulator running):
  ```bash
  pnpm android
  ```
  This runs `react-native run-android` and installs the app onto the active emulator.

Troubleshooting
- Accept SDK licenses:
  ```bash
  yes | "$ANDROID_HOME"/cmdline-tools/latest/bin/sdkmanager --licenses || true
  ```
- Clean Android build if you hit Gradle errors:
  ```bash
  cd android && ./gradlew clean && cd -
  ```
- If Metro cannot connect, ensure the emulator is running and try:
  ```bash
  adb reverse tcp:8081 tcp:8081
  ```

## Key Components

- **Master Device**: Controls session timing and sends sync signals
- **Client Device**: Receives signals and vibrates in sync
- **Timing Service**: Handles latency measurement and clock synchronization
- **Vibration Service**: Manages precise vibration scheduling

## Usage Flow

1. Launch app on both devices
2. Select "Master" on one device, "Client" on the other
3. Connect both to the same WebSocket server
4. Master configures tempo and duration
5. Master starts session - both devices vibrate alternately

The scaffold is ready for React Native development environment setup!

## Build Android App (from android folder)

Use these steps to build APKs/AABs directly from the android folder using Gradle. This is useful for testing on devices and for Play Store distribution.

1) Prerequisites
- JDK 17 installed and JAVA_HOME set.
- Android SDK installed and ANDROID_HOME set (see emulator section above).
- Ensure Gradle wrapper is executable:
  ```bash
  cd android
  chmod +x gradlew
  ```

2) Build a debug APK (quick local install)
- Command:
  ```bash
  cd android
  ./gradlew assembleDebug
  ```
- Output:
  - app/build/outputs/apk/debug/app-debug.apk
- Optional install on a connected device/emulator:
  ```bash
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  ```

3) Set up release signing (one-time)
- Generate a keystore (replace values as needed):
  ```bash
  keytool -genkeypair -v -storetype JKS -keystore my-release-key.jks \
    -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
  ```
  Move the file into android/app/ (recommended):
  ```bash
  mv my-release-key.jks android/app/
  ```
- Add these properties to android/gradle.properties (create if missing):
  ```properties
  MYAPP_UPLOAD_STORE_FILE=my-release-key.jks
  MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
  MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
  MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
  ```
- Configure signing in android/app/build.gradle (usually present in RN 0.72 template). Ensure release uses the properties above:
  ```gradle
  android {
    signingConfigs {
      release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
          storeFile file(MYAPP_UPLOAD_STORE_FILE)
          storePassword MYAPP_UPLOAD_STORE_PASSWORD
          keyAlias MYAPP_UPLOAD_KEY_ALIAS
          keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
      }
    }
    buildTypes {
      release {
        signingConfig signingConfigs.release
        // Enables code shrinking/obfuscation if desired
        // minifyEnabled true
        // proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
      }
    }
  }
  ```

4) Build signed release artifacts
- APK (useful for sideloading/testing):
  ```bash
  cd android
  ./gradlew assembleRelease
  ```
  Output: app/build/outputs/apk/release/app-release.apk

- AAB (required for Play Store):
  ```bash
  cd android
  ./gradlew bundleRelease
  ```
  Output: app/build/outputs/bundle/release/app-release.aab

5) Common Gradle tasks and tips
- Clean build (helpful after dependency/SDK changes):
  ```bash
  cd android && ./gradlew clean
  ```
- Accept all Android SDK licenses:
  ```bash
  yes | "$ANDROID_HOME"/cmdline-tools/latest/bin/sdkmanager --licenses || true
  ```
- If Hermes/NDK issues occur, ensure SDK/NDK versions in android/gradle.properties and build.gradle match your installed SDK components.
- For CI builds, run Gradle with --no-daemon and cache ~/.gradle and ~/.android for faster builds.

Once built, you can upload the .aab to Google Play Console or distribute the .apk for testing.
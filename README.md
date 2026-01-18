# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Environment Setup

To start working with this repository, you'll need to set up your development environment.

### 1. Download and Install Android Studio

Download and install Android Studio from the [official website](https://developer.android.com/studio). This will provide you with the necessary Android SDKs, emulator, and other tools.

### 2. Set Environment Variables

After installing Android Studio, you need to configure the `ANDROID_HOME` and `ANDROID_SDK_ROOT` environment variables.

- **Windows**:
  1. Open the Start Menu, type `env`, and select "Edit the system environment variables".
  2. In the System Properties window, click on "Environment Variables...".
  3. Under "System variables", click "New...".
  4. For "Variable name", enter `ANDROID_HOME` and for second one `ANDROID_SDK_ROOT`.
  5. For "Variable value", for both enter the path to your Android SDK. By default, it's `C:\Users\<your-username>\AppData\Local\Android\Sdk`.
  6. Add the platform-tools to the Path. Select the "Path" variable under "System variables" and click "Edit...". Add a new entry with `%ANDROID_HOME%\platform-tools`.
  7. Make sure u use Java 17 (\Java\jdk-17\bin is on top of the "Path" variables).

- **macOS/Linux**:
  1. Open your shell profile file (e.g., `~/.bash_profile`, `~/.zshrc`).
  2. Add the following lines:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```
  3. Save the file and reload your shell.

### 3. Enable Developer Mode on Your Android Phone

To run the app on a physical Android device, you need to enable Developer options and USB debugging.

1.  Open **Settings** on your Android phone.
2.  Go to **About phone**.
3.  Tap on **Build number** 7 times until you see a message that says "You are now a developer!".
4.  Go back to the main Settings menu and you should now see a new option called **Developer options**.
5.  Open **Developer options**.
6.  Enable **USB debugging**.

Now you are ready to proceed with the project setup.

## Get started
Checking connected devices:
   ```bash
   adb devices
   ```
1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```


In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

declare module 'expo-media-library';
declare module 'expo-camera';
declare module 'expo-image-picker';
declare module 'expo-speech-recognition';

// Some Expo packages export default or named helpers — keep types permissive here
declare module 'expo-media-library' {
  const content: any;
  export = content;
}

declare module 'expo-camera' {
  const content: any;
  export = content;
}

declare module 'expo-image-picker' {
  const content: any;
  export = content;
}

declare module 'expo-speech-recognition' {
  const content: any;
  export = content;
}

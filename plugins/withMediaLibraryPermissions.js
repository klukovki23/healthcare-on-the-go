const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin that ensures required Android permissions for camera/media/microphone
 * are present in AndroidManifest.xml. This is useful when a library's own
 * plugin doesn't add the permissions you need or when you want to ensure
 * permissions are present for expo-media-library usage.
 */
function ensurePermission(manifest, permissionName) {
    const usesPermissions = manifest.manifest['uses-permission'] ||= [];
    const exists = usesPermissions.some((p) => p && p.$ && p.$['android:name'] === permissionName);
    if (!exists) {
        usesPermissions.push({ $: { 'android:name': permissionName } });
    }
}

module.exports = function withMediaLibraryPermissions(config) {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults;

        // Add common permissions used by media/camera/recording features
        ensurePermission(manifest, 'android.permission.CAMERA');
        ensurePermission(manifest, 'android.permission.RECORD_AUDIO');
        ensurePermission(manifest, 'android.permission.READ_EXTERNAL_STORAGE');
        ensurePermission(manifest, 'android.permission.WRITE_EXTERNAL_STORAGE');

        // For Android 13+ you may want to add granular media read permissions:
        // ensurePermission(manifest, 'android.permission.READ_MEDIA_IMAGES');

        config.modResults = manifest;
        return config;
    });
};

module.exports.pluginName = 'withMediaLibraryPermissions';

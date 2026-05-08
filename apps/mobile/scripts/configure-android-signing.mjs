import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');

const requiredEnv = [
    'ANDROID_KEYSTORE_BASE64',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_PASSWORD',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
    throw new Error(`Missing Android signing environment variables: ${missingEnv.join(', ')}`);
}

const keystorePath = path.join(projectRoot, 'android', 'app', 'release.keystore');
fs.writeFileSync(keystorePath, Buffer.from(process.env.ANDROID_KEYSTORE_BASE64, 'base64'));

const gradlePropertiesPath = path.join(projectRoot, 'android', 'gradle.properties');
const signingProperties = [
    '',
    'SMART_INVOICE_UPLOAD_STORE_FILE=release.keystore',
    `SMART_INVOICE_UPLOAD_KEY_ALIAS=${process.env.ANDROID_KEY_ALIAS}`,
    `SMART_INVOICE_UPLOAD_STORE_PASSWORD=${process.env.ANDROID_KEYSTORE_PASSWORD}`,
    `SMART_INVOICE_UPLOAD_KEY_PASSWORD=${process.env.ANDROID_KEY_PASSWORD}`,
    '',
].join('\n');
fs.appendFileSync(gradlePropertiesPath, signingProperties);

const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
let updatedBuildGradle = buildGradle;

// Add release signing config inside signingConfigs block if not already present
if (!updatedBuildGradle.includes('SMART_INVOICE_UPLOAD_STORE_FILE')) {
    updatedBuildGradle = updatedBuildGradle.replace(
        /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s*}\s*)\n\s*}/,
        `$1\n        release {\n            if (project.hasProperty('SMART_INVOICE_UPLOAD_STORE_FILE')) {\n                storeFile file(SMART_INVOICE_UPLOAD_STORE_FILE)\n                storePassword SMART_INVOICE_UPLOAD_STORE_PASSWORD\n                keyAlias SMART_INVOICE_UPLOAD_KEY_ALIAS\n                keyPassword SMART_INVOICE_UPLOAD_KEY_PASSWORD\n            }\n        }\n    }`
    );
}

if (!updatedBuildGradle.includes('SMART_INVOICE_UPLOAD_STORE_FILE')) {
    throw new Error(
        'Unable to inject Android release signing config into android/app/build.gradle'
    );
}

// Update release buildType to use release signing config
const releaseSigningConfigPattern =
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
updatedBuildGradle = updatedBuildGradle.replace(
    releaseSigningConfigPattern,
    '$1signingConfig signingConfigs.release'
);

if (
    !updatedBuildGradle.match(
        /buildTypes[\s\S]*?release[\s\S]*?signingConfig signingConfigs\.release/
    )
) {
    throw new Error('Unable to switch Android release build type to signingConfigs.release');
}

fs.writeFileSync(buildGradlePath, updatedBuildGradle);

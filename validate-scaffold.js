const fs = require('fs');
const path = require('path');

console.log('🔍 Validating React Native Scaffold Structure...\n');

const requiredFiles = [
    'package.json',
    'App.js',
    'android/app/src/main/AndroidManifest.xml'
];

const requiredDirs = [
    'components',
    'services',
    'utils',
    'android'
];

let allValid = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ Missing: ${file}`);
        allValid = false;
    }
});

console.log('\n📂 Checking required directories:');
requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ Missing: ${dir}/`);
        allValid = false;
    }
});

// Check package.json dependencies
if (fs.existsSync('package.json')) {
    console.log('\n📦 Checking package.json dependencies:');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['react-native', '@react-native-async-storage/async-storage', 'react-native-permissions'];
    
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`❌ Missing dependency: ${dep}`);
            allValid = false;
        }
    });
}

console.log('\n' + '='.repeat(50));
if (allValid) {
    console.log('🎉 React Native scaffold validation PASSED!');
    console.log('📱 Ready for React Native development environment');
} else {
    console.log('⚠️  React Native scaffold validation FAILED!');
    console.log('🔧 Some files or dependencies are missing');
}
console.log('='.repeat(50));
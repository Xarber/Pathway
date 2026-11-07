// SPDX-License-Identifier: AGPL-3.0-only
const {withAppBuildGradle}=require('expo/config-plugins');
module.exports=config=>withAppBuildGradle(config,mod=>{let source=mod.modResults.contents;if(!source.includes('signingConfigs {'))throw Error('Unsupported Gradle template: signingConfigs missing');source=source.replace('signingConfigs {',`signingConfigs {
        pathwayRelease {
            def signingPath = System.getenv("PATHWAY_KEYSTORE_PATH")
            if (signingPath) {
                storeFile file(signingPath)
                storePassword System.getenv("PATHWAY_KEYSTORE_PASSWORD")
                keyAlias System.getenv("PATHWAY_KEY_ALIAS")
                keyPassword System.getenv("PATHWAY_KEY_PASSWORD")
            }
        }`);const marker=/release\s*\{([\s\S]*?)signingConfig signingConfigs\.debug/;if(!marker.test(source))throw Error('Unsupported Gradle template: release signing not found');source=source.replace(marker,(_,body)=>`release {${body}signingConfig signingConfigs.pathwayRelease`);mod.modResults.contents=source;return mod;});

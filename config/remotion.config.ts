/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config as RemotionConfig } from "@remotion/cli/config";
import { Configuration as WebpackConfiguration } from 'webpack';
import path from 'path';

RemotionConfig.setChromiumOpenGlRenderer("angle");
RemotionConfig.setVideoImageFormat("jpeg");
RemotionConfig.setPixelFormat("yuv420p");
RemotionConfig.setEntryPoint("src/index.ts"); // Chỉ định entry point

// Fix timeout issue với ThreeCanvas - set concurrency thấp
RemotionConfig.setConcurrency(1);

RemotionConfig.overrideWebpackConfig((currentConfiguration: WebpackConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      fallback: {
        ...(currentConfiguration.resolve?.fallback ?? {}),
        fs: false,
        path: false,
      },
      alias: {
        ...(currentConfiguration.resolve?.alias ?? {}),
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});

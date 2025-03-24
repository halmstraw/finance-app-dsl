/**
 * Generator module index file
 * Exports all generators and common types
 */

import { App } from '../parser.js';
import { WebGenerator } from './web/web-generator.js';
import { IOSGenerator } from './ios/index.js';
import { AndroidGenerator } from './android/index.js';

export type Platform = 'web' | 'ios' | 'android';

export async function generateCode(app: App, platforms: Platform[]): Promise<void> {
  for (const platform of platforms) {
    switch (platform) {
      case 'web':
        await new WebGenerator(app).generate();
        break;
      case 'ios':
        await new IOSGenerator(app).generate();
        break;
      case 'android':
        await new AndroidGenerator(app).generate();
        break;
      default:
        console.warn(`Unsupported platform: ${platform}`);
    }
  }
}

/**
 * PlatformType enum - used to specify which platform to generate for
 */
export enum PlatformType {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios'
}

/**
 * Factory function to create the appropriate generator
 */
export async function createGenerator(
  platform: PlatformType,
  app: any,
  models: any[],
  screens: any[],
  api?: any,
  options?: any
): Promise<any> {
  switch (platform) {
    case PlatformType.WEB:
      return new WebGenerator(app);
    
    case PlatformType.ANDROID:
      return new AndroidGenerator(app);
    
    case PlatformType.IOS:
      return new IOSGenerator(app);
    
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
} 
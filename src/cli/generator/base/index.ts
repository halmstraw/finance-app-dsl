import { App } from '../../parser.js';
import * as path from 'path';

export abstract class BaseGenerator {
  protected app: App;
  protected outputDir: string;

  constructor(app: App, platform: string) {
    this.app = app;
    this.outputDir = path.join(process.cwd(), 'generated', platform);
  }

  abstract generate(): Promise<void>;

  protected getApp(): App {
    return this.app;
  }

  protected getOutputDir(): string {
    return this.outputDir;
  }
} 
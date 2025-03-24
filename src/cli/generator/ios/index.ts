import { BaseGenerator } from '../base/index.js';
import { App, Model, Screen } from '../../parser.js';
import * as fs from 'fs';
import * as path from 'path';

export class IOSGenerator extends BaseGenerator {
  constructor(app: App) {
    super(app, 'ios');
  }

  async generate(): Promise<void> {
    const app = this.getApp();
    console.log(`[ios] Generating iOS application: ${app.name}`);
    
    // Create base directory structure
    const iosDir = path.join(this.getOutputDir(), 'ios');
    fs.mkdirSync(iosDir, { recursive: true });

    // Generate models
    for (const model of app.models) {
      await this.generateModel(model);
    }

    // Generate screens
    for (const screen of app.screens) {
      await this.generateScreen(screen);
    }

    // Generate API client
    await this.generateApiClient();

    // Generate main application code
    await this.generateMainApp();
  }

  private async generateModel(model: Model): Promise<void> {
    console.log(`[ios] Generating model: ${model.name}`);
    const modelDir = path.join(this.getOutputDir(), 'ios', 'Models');
    fs.mkdirSync(modelDir, { recursive: true });

    const modelContent = this.generateModelContent(model);
    fs.writeFileSync(path.join(modelDir, `${model.name}.swift`), modelContent);
  }

  private async generateScreen(screen: Screen): Promise<void> {
    console.log(`[ios] Generating screen: ${screen.name}`);
    const screenDir = path.join(this.getOutputDir(), 'ios', 'Screens');
    fs.mkdirSync(screenDir, { recursive: true });

    const screenContent = this.generateScreenContent(screen);
    fs.writeFileSync(path.join(screenDir, `${screen.name}View.swift`), screenContent);
  }

  private async generateApiClient(): Promise<void> {
    console.log('[ios] Generating API client');
    const apiDir = path.join(this.getOutputDir(), 'ios', 'Networking');
    fs.mkdirSync(apiDir, { recursive: true });

    const apiContent = this.generateApiContent();
    fs.writeFileSync(path.join(apiDir, 'APIClient.swift'), apiContent);
  }

  private async generateMainApp(): Promise<void> {
    console.log('[ios] Generating main application code');
    const appDir = path.join(this.getOutputDir(), 'ios', 'App');
    fs.mkdirSync(appDir, { recursive: true });

    const appContent = this.generateAppContent();
    fs.writeFileSync(path.join(appDir, `${this.getApp().name}App.swift`), appContent);
  }

  private generateModelContent(model: Model): string {
    return `import Foundation

struct ${model.name}: Codable {
${model.properties.map(prop => `    let ${prop.name}: ${this.mapTypeToSwift(prop.type)}`).join('\n')}
}`;
  }

  private generateScreenContent(screen: Screen): string {
    return `import SwiftUI

struct ${screen.name}View: View {
    var body: some View {
        VStack {
            Text("${screen.title}")
                .font(.title)
                .padding()
            
            // Add your view content here
        }
    }
}

#Preview {
    ${screen.name}View()
}`;
  }

  private generateApiContent(): string {
    return `import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL = "${this.getApp().api?.baseUrl || ''}"
    
    private init() {}
    
    // Add API methods here
}`;
  }

  private generateAppContent(): string {
    return `import SwiftUI

@main
struct ${this.getApp().name}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`;
  }

  private mapTypeToSwift(type: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'String',
      'number': 'Double',
      'boolean': 'Bool',
      'date': 'Date',
      'array': '[Any]',
      'object': '[String: Any]'
    };
    return typeMap[type.toLowerCase()] || 'Any';
  }
} 
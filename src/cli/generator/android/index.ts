import { BaseGenerator } from '../base/index.js';
import { App, Model, Screen } from '../../parser.js';
import * as fs from 'fs';
import * as path from 'path';

export class AndroidGenerator extends BaseGenerator {
  constructor(app: App) {
    super(app, 'android');
  }

  async generate(): Promise<void> {
    const app = this.getApp();
    console.log(`[android] Generating Android application: ${app.name}`);
    
    // Create base directory structure
    const androidDir = path.join(this.getOutputDir(), 'android');
    fs.mkdirSync(androidDir, { recursive: true });

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
    console.log(`[android] Generating model: ${model.name}`);
    const modelDir = path.join(this.getOutputDir(), 'android', 'app', 'src', 'main', 'java', 'com', this.getApp().name.toLowerCase(), 'models');
    fs.mkdirSync(modelDir, { recursive: true });

    const modelContent = this.generateModelContent(model);
    fs.writeFileSync(path.join(modelDir, `${model.name}.kt`), modelContent);
  }

  private async generateScreen(screen: Screen): Promise<void> {
    console.log(`[android] Generating screen: ${screen.name}`);
    const screenDir = path.join(this.getOutputDir(), 'android', 'app', 'src', 'main', 'java', 'com', this.getApp().name.toLowerCase(), 'ui', 'screens');
    fs.mkdirSync(screenDir, { recursive: true });

    const screenContent = this.generateScreenContent(screen);
    fs.writeFileSync(path.join(screenDir, `${screen.name}Screen.kt`), screenContent);
  }

  private async generateApiClient(): Promise<void> {
    console.log('[android] Generating API client');
    const apiDir = path.join(this.getOutputDir(), 'android', 'app', 'src', 'main', 'java', 'com', this.getApp().name.toLowerCase(), 'network');
    fs.mkdirSync(apiDir, { recursive: true });

    const apiContent = this.generateApiContent();
    fs.writeFileSync(path.join(apiDir, 'ApiClient.kt'), apiContent);
  }

  private async generateMainApp(): Promise<void> {
    console.log('[android] Generating main application code');
    const appDir = path.join(this.getOutputDir(), 'android', 'app', 'src', 'main', 'java', 'com', this.getApp().name.toLowerCase());
    fs.mkdirSync(appDir, { recursive: true });

    const appContent = this.generateAppContent();
    fs.writeFileSync(path.join(appDir, `${this.getApp().name}Application.kt`), appContent);
  }

  private generateModelContent(model: Model): string {
    return `package com.${this.getApp().name.toLowerCase()}.models

import com.google.gson.annotations.SerializedName

data class ${model.name}(
${model.properties.map(prop => `    @SerializedName("${prop.name}")
    val ${prop.name}: ${this.mapTypeToKotlin(prop.type)}`).join(',\n')}
)`;
  }

  private generateScreenContent(screen: Screen): string {
    return `package com.${this.getApp().name.toLowerCase()}.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ${screen.name}Screen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "${screen.title}",
            style = MaterialTheme.typography.headlineMedium
        )
        
        // Add your screen content here
    }
}`;
  }

  private generateApiContent(): string {
    return `package com.${this.getApp().name.toLowerCase()}.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private const val BASE_URL = "${this.getApp().api?.baseUrl || ''}"
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        
    // Add API interface here
}`;
  }

  private generateAppContent(): string {
    return `package com.${this.getApp().name.toLowerCase()}

import android.app.Application
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

class ${this.getApp().name}Application : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

@Composable
fun ${this.getApp().name}App() {
    val navController = rememberNavController()
    
    NavHost(navController = navController, startDestination = "login") {
        // Add navigation routes here
    }
}`;
  }

  private mapTypeToKotlin(type: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'String',
      'number': 'Double',
      'boolean': 'Boolean',
      'date': 'Long',
      'array': 'List<Any>',
      'object': 'Map<String, Any>'
    };
    return typeMap[type.toLowerCase()] || 'Any';
  }
} 
import { ValidationAcceptor } from 'langium';
import { App } from './generated/ast.js';
import type { FinanceAppDslServices } from './finance-app-dsl-module.js';

/**
 * Register validation checks for finance app DSL
 */
export function registerValidationChecks(services: FinanceAppDslServices) {
    const registry = services.validation.ValidationRegistry;
    
    // Register simple validation check
    registry.register({
        App: validator.checkApp
    });
}

/**
 * Implementation of finance app DSL validators
 */
const validator = {
    /**
     * Check basic app requirements
     */
    checkApp(app: App, accept: ValidationAcceptor): void {
        // Check that there is at least one model
        if (!app.models || app.models.length === 0) {
            accept('warning', 'No models defined. At least one model should be defined.', { node: app, property: 'models' });
        }
        
        // Check that there's at least one screen
        if (!app.screens || app.screens.length === 0) {
            accept('warning', 'No screens defined. At least one screen should be defined.', { node: app, property: 'screens' });
        }
        
        // Check for initial screen
        if (app.screens && app.screens.length > 0) {
            const initialScreens = app.screens.filter(screen => screen.isInitial);
            if (initialScreens.length === 0) {
                accept('error', 'No initial screen defined. One screen must be marked as initial.', { node: app, property: 'screens' });
            } else if (initialScreens.length > 1) {
                accept('error', 'Multiple initial screens defined. Only one screen can be marked as initial.', { node: app, property: 'screens' });
            }
        }
    }
};

import { Module, inject } from 'langium';
import { createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, LangiumServices, LangiumSharedServices, PartialLangiumServices } from 'langium/lsp';
import { FinanceAppDSLGeneratedModule, FinanceAppDslGeneratedSharedModule } from './generated/module.js';
import { registerValidationChecks } from './finance-app-dsl-validator.js';

/**
 * Declaration of custom services
 */
export type FinanceAppDslAddedServices = {
    // Add your custom services here
}

/**
 * Union of Langium default services and your custom services
 */
export type FinanceAppDslServices = LangiumServices & FinanceAppDslAddedServices

/**
 * Dependency injection module for custom services
 */
export const FinanceAppDslModule: Module<FinanceAppDslServices, PartialLangiumServices & FinanceAppDslAddedServices> = {
    // Add service overrides here
};

/**
 * Create the full set of services required by Langium
 */
export function createFinanceAppDslServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    FinanceAppDsl: FinanceAppDslServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        FinanceAppDslGeneratedSharedModule
    );
    const FinanceAppDsl = inject(
        createDefaultModule({ shared }),
        FinanceAppDSLGeneratedModule,
        FinanceAppDslModule
    );
    shared.ServiceRegistry.register(FinanceAppDsl);
    registerValidationChecks(FinanceAppDsl);
    return { shared, FinanceAppDsl };
}

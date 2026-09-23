import { UserSubject, DocumentResource, EnvironmentContext, ABACEvaluationResult } from '../types';
import { abacRules } from './rules';

export class ABACEngine {
  /**
   * Evalúa un contexto completo (User, Resource, Environment) contra todas las políticas registradas.
   * Retorna PERMITIDO solo si TODAS las políticas se cumplen (AND lógico).
   */
  public static evaluate(
    user: UserSubject,
    document: DocumentResource,
    env: EnvironmentContext,
    action: string
  ): ABACEvaluationResult {
    
    for (const rule of abacRules) {
      const result = rule.evaluate(user, document, env, action);
      if (!result.passed) {
        return {
          permitted: false,
          reason: result.reason || `Violación de política: ${rule.nombre}`
        };
      }
    }

    return {
      permitted: true,
      reason: 'Validación ABAC exitosa'
    };
  }
}
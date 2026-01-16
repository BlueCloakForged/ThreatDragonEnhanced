/**
 * @name validationService
 * @description Unified validation service - single entry point for all validation
 */

import { createResult, createError, fromAjvErrors, fromStringErrors, ErrorCodes, Severity } from './validationResult.js';
import { validateCells, validateDiagram, autoFixCells } from './cellValidator.js';
import ajvSchema from '@/service/schema/ajv.js';

/**
 * Validation modes
 */
export const ValidationMode = {
    STRICT: 'strict',       // All errors stop processing
    LENIENT: 'lenient',     // Warnings only, attempt to continue
    AUTO_FIX: 'auto-fix'    // Attempt to fix issues automatically
};

/**
 * Unified Validation Service
 */
class ValidationService {
    constructor() {
        this.mode = ValidationMode.STRICT;
        this.lastResult = null;
    }

    /**
     * Set validation mode
     */
    setMode(mode) {
        this.mode = mode;
        return this;
    }

    /**
     * Validate a complete threat model
     * @param {Object} threatModel - The threat model to validate
     * @returns {Object} - ValidationResult
     */
    validateThreatModel(threatModel) {
        const result = createResult({ source: 'validationService.threatModel' });
        
        if (!threatModel) {
            result.addError(createError({
                code: ErrorCodes.MISSING_REQUIRED,
                message: 'Threat model is null or undefined',
                path: 'threatModel'
            }));
            return this._finalize(result);
        }

        // 1. Schema validation using AJV
        const schemaResult = this.validateSchema(threatModel);
        result.merge(schemaResult);

        // 2. Validate all diagrams if present
        if (threatModel.detail?.diagrams) {
            threatModel.detail.diagrams.forEach((diagram, index) => {
                const diagramResult = this.validateDiagramStructure(diagram, index);
                result.merge(diagramResult);
            });
        }

        return this._finalize(result);
    }

    /**
     * Validate threat model against JSON schema
     * @param {Object} model - Model to validate
     * @returns {Object} - ValidationResult
     */
    validateSchema(model) {
        const result = createResult({ source: 'validationService.schema' });

        // Try V2 schema first
        if (ajvSchema.isV2(model)) {
            return result; // Valid V2
        }

        // Try V1 schema
        if (ajvSchema.isV1(model)) {
            result.addWarning(createError({
                code: ErrorCodes.SCHEMA_INVALID,
                message: 'Model uses V1 schema format',
                severity: Severity.WARNING,
                suggestion: 'Consider upgrading to V2 format'
            }));
            return result;
        }

        // Try other formats
        if (ajvSchema.isTmBom(model)) {
            result.addInfo(createError({
                code: ErrorCodes.SCHEMA_INVALID,
                message: 'Model is in TM-BOM format',
                severity: Severity.INFO
            }));
            return result;
        }

        if (ajvSchema.isOtm(model)) {
            result.addInfo(createError({
                code: ErrorCodes.SCHEMA_INVALID,
                message: 'Model is in Open Threat Model format',
                severity: Severity.INFO
            }));
            return result;
        }

        // Get detailed V2 errors
        const ajvErrors = ajvSchema.checkV2(model);
        const ajvResult = fromAjvErrors(ajvErrors, 'ajv-v2');
        result.merge(ajvResult);

        return result;
    }

    /**
     * Validate a diagram structure including cells
     * @param {Object} diagram - Diagram to validate
     * @param {number} index - Diagram index
     * @returns {Object} - ValidationResult
     */
    validateDiagramStructure(diagram, index = 0) {
        const result = createResult({ source: `validationService.diagram[${index}]` });

        if (!diagram) {
            result.addError(createError({
                code: ErrorCodes.MISSING_REQUIRED,
                message: `Diagram ${index} is null or undefined`,
                path: `diagrams[${index}]`
            }));
            return result;
        }

        // Use cell validator
        const diagramResult = validateDiagram(diagram);
        result.merge(diagramResult);

        return result;
    }

    /**
     * Validate cells before rendering
     * @param {Array} cells - Cells array
     * @returns {Object} - ValidationResult
     */
    validateCellsForRender(cells) {
        return validateCells(cells);
    }

    /**
     * Validate and optionally fix cells
     * @param {Array} cells - Cells to validate
     * @returns {Object} - { result, cells, fixes }
     */
    validateAndFixCells(cells) {
        const result = validateCells(cells);

        if (this.mode === ValidationMode.AUTO_FIX && !result.valid) {
            const { cells: fixedCells, fixes } = autoFixCells(cells);
            const fixedResult = validateCells(fixedCells);

            return {
                result: fixedResult,
                cells: fixedCells,
                fixes,
                originalResult: result
            };
        }

        return { result, cells, fixes: [] };
    }

    /**
     * Validate DFDIR structure
     * @param {Object} dfdir - DFDIR object to validate
     * @returns {Object} - ValidationResult
     */
    validateDFDIR(dfdir) {
        const result = createResult({ source: 'validationService.dfdir' });

        if (!dfdir) {
            result.addError(createError({
                code: ErrorCodes.MISSING_REQUIRED,
                message: 'DFDIR is null or undefined',
                path: 'dfdir'
            }));
            return result;
        }

        // Use DFDIR's built-in validation
        if (typeof dfdir.validate === 'function') {
            const dfdirValidation = dfdir.validate();
            if (!dfdirValidation.valid) {
                const dfdirResult = fromStringErrors(dfdirValidation.errors, 'dfdir');
                result.merge(dfdirResult);
            }
        }

        return result;
    }

    /**
     * Quick validation check - returns boolean only
     * @param {Object} model - Model to validate
     * @returns {boolean}
     */
    isValid(model) {
        const result = this.validateThreatModel(model);
        return result.valid;
    }

    /**
     * Get last validation result
     * @returns {Object} - Last ValidationResult
     */
    getLastResult() {
        return this.lastResult;
    }

    /**
     * Log validation result to console
     * @param {Object} result - ValidationResult
     */
    logResult(result) {
        const prefix = '[ValidationService]';

        if (result.valid) {
            console.debug(`${prefix} ✓ Validation passed (${result.source})`);
        } else {
            console.warn(`${prefix} ✗ Validation failed (${result.source})`);
            result.errors.forEach(err => {
                console.error(`${prefix}   ${err.code}: ${err.message}`);
                if (err.suggestion) {
                    console.info(`${prefix}     → ${err.suggestion}`);
                }
            });
        }

        if (result.warnings.length > 0) {
            result.warnings.forEach(warn => {
                console.warn(`${prefix}   ⚠ ${warn.message}`);
            });
        }
    }

    /**
     * Finalize result and store it
     */
    _finalize(result) {
        this.lastResult = result;
        return result;
    }
}

// Singleton instance
const validationService = new ValidationService();

/**
 * Convenience function for quick threat model validation
 */
export function validateThreatModel(model, options) {
    return validationService.validateThreatModel(model, options);
}

/**
 * Convenience function for cell validation
 */
export function validateCellsForRender(cells) {
    return validationService.validateCellsForRender(cells);
}

/**
 * Convenience function for DFDIR validation
 */
export function validateDFDIR(dfdir) {
    return validationService.validateDFDIR(dfdir);
}

export { ValidationService };
export default validationService;


/**
 * @name validationResult
 * @description Unified validation result formatter for consistent error handling
 */

/**
 * Severity levels for validation issues
 */
export const Severity = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

/**
 * Validation error codes
 */
export const ErrorCodes = {
    // Schema errors
    SCHEMA_INVALID: 'SCHEMA_INVALID',
    MISSING_REQUIRED: 'MISSING_REQUIRED',
    INVALID_TYPE: 'INVALID_TYPE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    
    // Cell/Diagram errors
    MISSING_SHAPE: 'MISSING_SHAPE',
    INVALID_SHAPE: 'INVALID_SHAPE',
    MISSING_ID: 'MISSING_ID',
    MISSING_POSITION: 'MISSING_POSITION',
    MISSING_SIZE: 'MISSING_SIZE',
    INVALID_SOURCE: 'INVALID_SOURCE',
    INVALID_TARGET: 'INVALID_TARGET',
    ORPHAN_FLOW: 'ORPHAN_FLOW',
    
    // DFDIR errors
    EMPTY_MODEL: 'EMPTY_MODEL',
    INVALID_ELEMENT: 'INVALID_ELEMENT',
    INVALID_FLOW: 'INVALID_FLOW',
    REFERENCE_ERROR: 'REFERENCE_ERROR',
    
    // General errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Create a validation error object
 * @param {Object} options
 * @returns {Object}
 */
export function createError({
    code = ErrorCodes.UNKNOWN_ERROR,
    message = 'Unknown validation error',
    path = '',
    severity = Severity.ERROR,
    suggestion = '',
    context = {}
}) {
    return {
        code,
        message,
        path,
        severity,
        suggestion,
        context,
        timestamp: new Date().toISOString()
    };
}

/**
 * Create a validation result object
 * @param {Object} options
 * @returns {Object}
 */
export function createResult({
    valid = true,
    errors = [],
    warnings = [],
    info = [],
    source = 'unknown',
    validatedAt = new Date().toISOString()
}) {
    return {
        valid,
        errors,
        warnings,
        info,
        source,
        validatedAt,
        
        // Computed properties
        get hasErrors() { return this.errors.length > 0; },
        get hasWarnings() { return this.warnings.length > 0; },
        get totalIssues() { return this.errors.length + this.warnings.length; },
        
        // Helper methods
        addError(error) {
            this.errors.push(error);
            this.valid = false;
        },
        addWarning(warning) {
            this.warnings.push(warning);
        },
        addInfo(infoItem) {
            this.info.push(infoItem);
        },
        merge(otherResult) {
            this.errors.push(...otherResult.errors);
            this.warnings.push(...otherResult.warnings);
            this.info.push(...otherResult.info);
            if (otherResult.errors.length > 0) {
                this.valid = false;
            }
            return this;
        },
        toJSON() {
            return {
                valid: this.valid,
                errors: this.errors,
                warnings: this.warnings,
                info: this.info,
                source: this.source,
                validatedAt: this.validatedAt
            };
        },
        toString() {
            if (this.valid) {
                return `✓ Validation passed (${this.source})`;
            }
            const errorMsgs = this.errors.map(e => `  ✗ ${e.message}`).join('\n');
            return `✗ Validation failed (${this.source}):\n${errorMsgs}`;
        }
    };
}

/**
 * Convert AJV errors to unified format
 * @param {Array} ajvErrors - AJV validation errors
 * @param {string} source - Source identifier
 * @returns {Object} - ValidationResult
 */
export function fromAjvErrors(ajvErrors, source = 'ajv') {
    const result = createResult({ source, valid: !ajvErrors || ajvErrors.length === 0 });

    if (!ajvErrors) {
        return result;
    }

    ajvErrors.forEach(ajvError => {
        const error = createError({
            code: mapAjvKeyword(ajvError.keyword),
            message: formatAjvMessage(ajvError),
            path: ajvError.instancePath || ajvError.dataPath || '',
            severity: Severity.ERROR,
            suggestion: getSuggestionForAjvError(ajvError),
            context: {
                keyword: ajvError.keyword,
                params: ajvError.params,
                schemaPath: ajvError.schemaPath
            }
        });
        result.addError(error);
    });

    return result;
}

/**
 * Convert simple string errors to unified format
 * @param {string[]} errorStrings
 * @param {string} source
 * @returns {Object} - ValidationResult
 */
export function fromStringErrors(errorStrings, source = 'unknown') {
    const result = createResult({ source, valid: errorStrings.length === 0 });

    errorStrings.forEach(msg => {
        result.addError(createError({
            code: ErrorCodes.UNKNOWN_ERROR,
            message: msg,
            severity: Severity.ERROR
        }));
    });

    return result;
}

/**
 * Map AJV keyword to error code
 */
function mapAjvKeyword(keyword) {
    const mapping = {
        required: ErrorCodes.MISSING_REQUIRED,
        type: ErrorCodes.INVALID_TYPE,
        format: ErrorCodes.INVALID_FORMAT,
        enum: ErrorCodes.INVALID_TYPE,
        minimum: ErrorCodes.INVALID_FORMAT,
        maximum: ErrorCodes.INVALID_FORMAT,
        minLength: ErrorCodes.INVALID_FORMAT,
        maxLength: ErrorCodes.INVALID_FORMAT
    };
    return mapping[keyword] || ErrorCodes.SCHEMA_INVALID;
}

/**
 * Format AJV error message
 */
function formatAjvMessage(ajvError) {
    const path = ajvError.instancePath || ajvError.dataPath || '';
    const pathStr = path ? `at '${path}'` : '';

    switch (ajvError.keyword) {
    case 'required':
        return `Missing required property '${ajvError.params.missingProperty}' ${pathStr}`.trim();
    case 'type':
        return `Expected ${ajvError.params.type} ${pathStr}`.trim();
    case 'enum':
        return `Value must be one of: ${ajvError.params.allowedValues.join(', ')} ${pathStr}`.trim();
    default:
        return `${ajvError.message} ${pathStr}`.trim();
    }
}

/**
 * Get suggestion for AJV error
 */
function getSuggestionForAjvError(ajvError) {
    switch (ajvError.keyword) {
    case 'required':
        return `Add the missing property '${ajvError.params.missingProperty}'`;
    case 'type':
        return `Ensure the value is of type '${ajvError.params.type}'`;
    default:
        return '';
    }
}

export default {
    Severity,
    ErrorCodes,
    createError,
    createResult,
    fromAjvErrors,
    fromStringErrors
};


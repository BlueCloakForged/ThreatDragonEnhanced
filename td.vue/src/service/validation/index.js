/**
 * @name validation
 * @description Unified validation module exports
 */

// Main service
export { default as validationService, ValidationService, ValidationMode, validateThreatModel, validateCellsForRender, validateDFDIR } from './validationService.js';

// Result formatting
export { Severity, ErrorCodes, createError, createResult, fromAjvErrors, fromStringErrors } from './validationResult.js';

// Cell validation
export { ValidShapes, ShapeAliases, isValidShape, resolveShape, isEdgeCell, validateCell, validateCells, validateDiagram, autoFixCells } from './cellValidator.js';

// Default export is the validation service
export { default } from './validationService.js';


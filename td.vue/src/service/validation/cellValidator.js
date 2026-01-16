/**
 * @name cellValidator
 * @description Validates X6 graph cells before rendering to prevent runtime errors
 */

import { createResult, createError, ErrorCodes, Severity } from './validationResult.js';

/**
 * Valid X6 shape names for Threat Dragon
 */
export const ValidShapes = {
    // Node shapes
    ACTOR: 'actor',
    PROCESS: 'process', 
    STORE: 'store',
    
    // Edge shapes
    FLOW: 'flow',
    
    // Trust boundary shapes
    TRUST_BOUNDARY_BOX: 'trust-boundary-box',
    TRUST_BOUNDARY_CURVE: 'trust-broundary-curve', // Note: typo exists in original code
    
    // Text shape
    TEXT: 'td-text-block'
};

/**
 * Shape aliases that should be converted
 */
export const ShapeAliases = {
    'tm.Actor': 'actor',
    'tm.Process': 'process',
    'tm.Store': 'store',
    'tm.Flow': 'flow',
    'tm.Boundary': 'trust-boundary-box',
    'tm.BoundaryBox': 'trust-boundary-box'
};

/**
 * Check if a shape name is valid
 */
export function isValidShape(shape) {
    if (!shape) return false;
    const validShapeValues = Object.values(ValidShapes);
    return validShapeValues.includes(shape) || Object.keys(ShapeAliases).includes(shape);
}

/**
 * Get the correct shape name (resolve aliases)
 */
export function resolveShape(shape) {
    if (ShapeAliases[shape]) {
        return ShapeAliases[shape];
    }
    return shape;
}

/**
 * Check if cell is an edge (flow/boundary curve)
 */
export function isEdgeCell(cell) {
    return cell.shape === ValidShapes.FLOW || 
           cell.shape === ValidShapes.TRUST_BOUNDARY_CURVE ||
           cell.source || cell.target;
}

/**
 * Validate a single cell
 * @param {Object} cell - The cell to validate
 * @param {number} index - Cell index for error messages
 * @param {Map} cellMap - Map of cell IDs for reference validation
 * @returns {Object} - ValidationResult
 */
export function validateCell(cell, index = 0, cellMap = new Map()) {
    const result = createResult({ source: `cell[${index}]` });
    
    // Required: id
    if (!cell.id) {
        result.addError(createError({
            code: ErrorCodes.MISSING_ID,
            message: `Cell ${index} is missing required 'id' property`,
            path: `cells[${index}].id`,
            suggestion: 'Add a unique UUID as the cell id'
        }));
    }
    
    // Required: shape
    if (!cell.shape) {
        result.addError(createError({
            code: ErrorCodes.MISSING_SHAPE,
            message: `Cell ${index} is missing required 'shape' property`,
            path: `cells[${index}].shape`,
            suggestion: `Add shape property with value like 'actor', 'process', 'store', or 'flow'`
        }));
    } else if (!isValidShape(cell.shape)) {
        result.addError(createError({
            code: ErrorCodes.INVALID_SHAPE,
            message: `Cell ${index} has invalid shape '${cell.shape}'`,
            path: `cells[${index}].shape`,
            suggestion: `Use one of: ${Object.values(ValidShapes).join(', ')}`,
            context: { invalidShape: cell.shape }
        }));
    }
    
    // Required: zIndex
    if (cell.zIndex === undefined || cell.zIndex === null) {
        result.addWarning(createError({
            code: ErrorCodes.MISSING_REQUIRED,
            message: `Cell ${index} is missing 'zIndex' property`,
            path: `cells[${index}].zIndex`,
            severity: Severity.WARNING,
            suggestion: 'Add zIndex for proper layering (0 for edges, 1 for nodes)'
        }));
    }
    
    // Node-specific validation
    if (cell.shape && !isEdgeCell(cell)) {
        validateNodeCell(cell, index, result);
    }
    
    // Edge-specific validation
    if (isEdgeCell(cell)) {
        validateEdgeCell(cell, index, cellMap, result);
    }
    
    return result;
}

/**
 * Validate node-specific properties
 */
function validateNodeCell(cell, index, result) {
    // Position required for nodes
    if (!cell.position || typeof cell.position.x !== 'number' || typeof cell.position.y !== 'number') {
        result.addError(createError({
            code: ErrorCodes.MISSING_POSITION,
            message: `Node cell ${index} is missing valid position {x, y}`,
            path: `cells[${index}].position`,
            suggestion: 'Add position object with numeric x and y values'
        }));
    }
    
    // Size required for nodes
    if (!cell.size || typeof cell.size.width !== 'number' || typeof cell.size.height !== 'number') {
        result.addError(createError({
            code: ErrorCodes.MISSING_SIZE,
            message: `Node cell ${index} is missing valid size {width, height}`,
            path: `cells[${index}].size`,
            suggestion: 'Add size object with numeric width and height values'
        }));
    }
    
    // Data object should exist
    if (!cell.data) {
        result.addWarning(createError({
            code: ErrorCodes.MISSING_REQUIRED,
            message: `Node cell ${index} is missing 'data' object`,
            path: `cells[${index}].data`,
            severity: Severity.WARNING,
            suggestion: 'Add data object with name, type, and other properties'
        }));
    }
}

/**
 * Validate edge-specific properties
 */
function validateEdgeCell(cell, index, cellMap, result) {
    // Source required for edges
    if (!cell.source) {
        result.addError(createError({
            code: ErrorCodes.INVALID_SOURCE,
            message: `Edge cell ${index} is missing 'source' property`,
            path: `cells[${index}].source`,
            suggestion: 'Add source object with cell ID reference'
        }));
    } else if (cell.source.cell && cellMap.size > 0 && !cellMap.has(cell.source.cell)) {
        result.addWarning(createError({
            code: ErrorCodes.ORPHAN_FLOW,
            message: `Edge cell ${index} references non-existent source cell '${cell.source.cell}'`,
            path: `cells[${index}].source.cell`,
            severity: Severity.WARNING,
            suggestion: 'Ensure source cell ID exists in the diagram'
        }));
    }

    // Target required for edges
    if (!cell.target) {
        result.addError(createError({
            code: ErrorCodes.INVALID_TARGET,
            message: `Edge cell ${index} is missing 'target' property`,
            path: `cells[${index}].target`,
            suggestion: 'Add target object with cell ID reference'
        }));
    } else if (cell.target.cell && cellMap.size > 0 && !cellMap.has(cell.target.cell)) {
        result.addWarning(createError({
            code: ErrorCodes.ORPHAN_FLOW,
            message: `Edge cell ${index} references non-existent target cell '${cell.target.cell}'`,
            path: `cells[${index}].target.cell`,
            severity: Severity.WARNING,
            suggestion: 'Ensure target cell ID exists in the diagram'
        }));
    }
}

/**
 * Validate all cells in a diagram
 * @param {Array} cells - Array of cells to validate
 * @returns {Object} - ValidationResult
 */
export function validateCells(cells) {
    const result = createResult({ source: 'cellValidator' });

    if (!cells || !Array.isArray(cells)) {
        result.addError(createError({
            code: ErrorCodes.INVALID_TYPE,
            message: 'Cells must be an array',
            path: 'cells',
            suggestion: 'Ensure diagram.cells is an array'
        }));
        return result;
    }

    if (cells.length === 0) {
        result.addWarning(createError({
            code: ErrorCodes.EMPTY_MODEL,
            message: 'Diagram contains no cells',
            path: 'cells',
            severity: Severity.WARNING,
            suggestion: 'Add nodes and flows to the diagram'
        }));
        return result;
    }

    // Build cell map for reference validation
    const cellMap = new Map();
    cells.forEach(cell => {
        if (cell.id) {
            cellMap.set(cell.id, cell);
        }
    });

    // Validate each cell
    cells.forEach((cell, index) => {
        const cellResult = validateCell(cell, index, cellMap);
        result.merge(cellResult);
    });

    return result;
}

/**
 * Validate a complete diagram structure
 * @param {Object} diagram - Diagram object with cells
 * @returns {Object} - ValidationResult
 */
export function validateDiagram(diagram) {
    const result = createResult({ source: 'diagramValidator' });

    if (!diagram) {
        result.addError(createError({
            code: ErrorCodes.MISSING_REQUIRED,
            message: 'Diagram is null or undefined',
            path: 'diagram'
        }));
        return result;
    }

    if (!diagram.title) {
        result.addWarning(createError({
            code: ErrorCodes.MISSING_REQUIRED,
            message: 'Diagram is missing title',
            path: 'diagram.title',
            severity: Severity.WARNING
        }));
    }

    if (!diagram.id && diagram.id !== 0) {
        result.addWarning(createError({
            code: ErrorCodes.MISSING_ID,
            message: 'Diagram is missing id',
            path: 'diagram.id',
            severity: Severity.WARNING
        }));
    }

    // Validate cells
    const cellsResult = validateCells(diagram.cells);
    result.merge(cellsResult);

    return result;
}

/**
 * Fix common cell issues automatically
 * @param {Array} cells - Cells to fix
 * @returns {Object} - { cells, fixes }
 */
export function autoFixCells(cells) {
    const fixes = [];

    if (!cells || !Array.isArray(cells)) {
        return { cells: [], fixes: ['Created empty cells array'] };
    }

    const fixedCells = cells.map((cell, index) => {
        const fixed = { ...cell };

        // Fix shape aliases
        if (fixed.shape && ShapeAliases[fixed.shape]) {
            const oldShape = fixed.shape;
            fixed.shape = ShapeAliases[fixed.shape];
            fixes.push(`Cell ${index}: Converted shape '${oldShape}' to '${fixed.shape}'`);
        }

        // Add missing zIndex
        if (fixed.zIndex === undefined) {
            fixed.zIndex = isEdgeCell(fixed) ? 0 : 1;
            fixes.push(`Cell ${index}: Added zIndex ${fixed.zIndex}`);
        }

        // Add missing data object
        if (!fixed.data) {
            fixed.data = {
                name: fixed.attrs?.text?.text || `Cell ${index}`,
                type: `tm.${capitalizeFirst(fixed.shape)}`,
                hasOpenThreats: false
            };
            fixes.push(`Cell ${index}: Added data object`);
        }

        return fixed;
    });

    return { cells: fixedCells, fixes };
}

function capitalizeFirst(str) {
    if (!str) return 'Process';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
    ValidShapes,
    ShapeAliases,
    isValidShape,
    resolveShape,
    isEdgeCell,
    validateCell,
    validateCells,
    validateDiagram,
    autoFixCells
};


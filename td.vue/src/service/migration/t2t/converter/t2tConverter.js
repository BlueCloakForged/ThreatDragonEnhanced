/**
 * T2T Converter
 * Converts DFDIR (DFD Intermediate Representation) to Threat Dragon v2.5.0 JSON format
 *
 * Threat Dragon uses joint.shapes.tm namespace with these types:
 * - tm.Actor (external entity)
 * - tm.Process (process/system)
 * - tm.Store (data store/database)
 * - tm.Flow (data flow between elements)
 * - tm.Boundary (trust boundary)
 */

import validationService, { validateDFDIR, validateCellsForRender } from '@/service/validation';

export class T2TConverter {
    constructor() {
        this.gridSnap = 100;
    }

    /**
     * Convert DFDIR to Threat Dragon JSON
     * @param {DFDIR} dfdir - DFDIR object with nodes and flows
     * @param {Object} options - Conversion options
     * @returns {Object} - Threat Dragon v2.5.0 JSON format
     */
    convert(dfdir, options = {}) {
        const {
            diagramName = 'Imported Topology',
            diagramDescription = 'Auto-generated from OTP document',
            projectName = 'T2T Import',
            projectOwner = 'Unknown',
            includeMetadata = true
        } = options;

        // Validate DFDIR using unified validation service
        const dfdirResult = validateDFDIR(dfdir);
        if (!dfdirResult.valid) {
            const errorMsgs = dfdirResult.errors.map(e => e.message).join(', ');
            throw new Error(`DFDIR validation failed: ${errorMsgs}`);
        }

        // Build Threat Dragon structure
        const diagram = this.buildDiagram(dfdir, diagramName, diagramDescription, includeMetadata);
        const threatModel = this.buildThreatModel(diagram, projectName, projectOwner, dfdir);

        return threatModel;
    }

    /**
     * Build diagram object with cells
     * @param {DFDIR} dfdir
     * @param {string} name
     * @param {string} description
     * @param {boolean} includeMetadata
     * @returns {Object} - Diagram object
     */
    buildDiagram(dfdir, name, description, includeMetadata) {
        const cells = [];

        // Convert elements (nodes)
        dfdir.elements.forEach(element => {
            const cell = this.convertElementToCell(element, includeMetadata);
            cells.push(cell);
        });

        // Convert flows (connections)
        dfdir.flows.forEach(flow => {
            const cell = this.convertFlowToCell(flow, includeMetadata);
            cells.push(cell);
        });

        return {
            id: 0, // Threat Dragon uses numeric IDs starting from 0
            title: name,
            diagramType: 'STRIDE',
            placeholder: description,
            thumbnail: './public/content/images/thumbnail.stride.jpg',
            version: '2.5.0',
            cells
        };
    }

    /**
     * Convert DFDIR element to Threat Dragon cell
     * @param {DFDElement} element
     * @param {boolean} includeMetadata
     * @returns {Object} - Threat Dragon cell
     */
    convertElementToCell(element, includeMetadata) {
        // Map DFDIR types to Threat Dragon types
        const typeMap = {
            actor: 'tm.Actor',
            process: 'tm.Process',
            store: 'tm.Store'
        };

        // Map to lowercase shape names for X6
        const shapeMap = {
            actor: 'actor',
            process: 'process',
            store: 'store'
        };

        const tdType = typeMap[element.type] || 'tm.Process';
        const shapeName = shapeMap[element.type] || 'process';

        // Base cell structure
        const cell = {
            position: {
                x: element.x,
                y: element.y
            },
            size: {
                width: 160,
                height: 80
            },
            attrs: {
                text: {
                    text: element.name
                },
                body: {
                    stroke: this.getStrokeColor(element),
                    strokeWidth: 2,
                    strokeDasharray: null
                }
            },
            visible: true,
            shape: shapeName,
            zIndex: 1,
            id: element.id,
            data: {
                type: tdType,
                name: element.name,
                description: this.buildDescription(element),
                outOfScope: false,
                reasonOutOfScope: '',
                hasOpenThreats: false,
                isBidirectional: false,
                isEncrypted: false,
                isPublicNetwork: false,
                protocol: '',
                threats: []
            }
        };

        // Add metadata if requested
        if (includeMetadata && element.metadata) {
            cell.data.metadata = {
                ipAddress: element.ipAddress,
                services: element.services,
                confidence: element.confidence,
                source: element.source,
                extractedFrom: element.metadata.extractedFrom,
                role: element.metadata.role,
                rawServices: element.metadata.rawServices
            };
        }

        return cell;
    }

    /**
     * Convert DFDIR flow to Threat Dragon cell
     * @param {DFDFlow} flow
     * @param {boolean} includeMetadata
     * @returns {Object} - Threat Dragon flow cell
     */
    convertFlowToCell(flow, includeMetadata) {
        // Build line attrs conditionally to avoid null values
        const lineAttrs = {
            stroke: flow.isEncrypted ? '#2E7D32' : '#333333',
            strokeWidth: 1.5,
            targetMarker: {
                name: 'block'
            }
        };

        // Only add strokeDasharray if it's a public network
        if (flow.isPublicNetwork) {
            lineAttrs.strokeDasharray = '5 5';
        }

        const cell = {
            shape: 'flow',
            attrs: {
                line: lineAttrs
            },
            width: 200,
            height: 100,
            zIndex: 10,
            connector: 'smooth',
            data: {
                type: 'tm.Flow',
                name: flow.protocol || 'Data Flow',
                description: this.buildFlowDescription(flow),
                outOfScope: false,
                reasonOutOfScope: '',
                hasOpenThreats: false,
                isBidirectional: false,
                isEncrypted: flow.isEncrypted,
                isPublicNetwork: flow.isPublicNetwork,
                protocol: flow.protocol,
                threats: []
            },
            id: flow.id,
            labels: [
                {
                    position: 0.5,
                    attrs: {
                        text: {
                            text: flow.protocol || '',
                            'font-weight': '400',
                            'font-size': 'small'
                        }
                    }
                }
            ],
            source: {
                id: flow.sourceId
            },
            target: {
                id: flow.targetId
            }
        };

        // Add metadata if requested
        if (includeMetadata && flow.metadata) {
            cell.data.metadata = {
                confidence: flow.confidence,
                source: flow.source,
                extractedFrom: flow.metadata.extractedFrom,
                sourceNode: flow.metadata.sourceNode,
                targetNode: flow.metadata.targetNode
            };
        }

        return cell;
    }

    /**
     * Build complete threat model structure
     * @param {Object} diagram
     * @param {string} projectName
     * @param {string} projectOwner
     * @param {DFDIR} dfdir
     * @returns {Object} - Threat Dragon threat model
     */
    buildThreatModel(diagram, projectName, projectOwner, dfdir) {
        const stats = dfdir.getStatistics();

        return {
            version: '2.5.0',
            summary: {
                title: projectName,
                owner: projectOwner,
                description: this.buildProjectDescription(dfdir, stats),
                id: 0
            },
            detail: {
                contributors: [],
                diagrams: [diagram],
                diagramTop: 0,
                reviewer: '',
                threatTop: 0
            }
        };
    }

    /**
     * Build element description from DFDIR data
     * @param {DFDElement} element
     * @returns {string}
     */
    buildDescription(element) {
        const parts = [];

        if (element.ipAddress) {
            parts.push(`IP: ${element.ipAddress}`);
        }

        if (element.services && element.services.length > 0) {
            parts.push(`Services: ${element.services.join(', ')}`);
        }

        if (element.metadata && element.metadata.role) {
            parts.push(`Role: ${element.metadata.role}`);
        }

        if (parts.length === 0) {
            parts.push(`${element.type === 'actor' ? 'External entity' : element.type === 'store' ? 'Data store' : 'System component'}`);
        }

        return parts.join(' | ');
    }

    /**
     * Build flow description
     * @param {DFDFlow} flow
     * @returns {string}
     */
    buildFlowDescription(flow) {
        const parts = [];

        if (flow.protocol) {
            parts.push(`Protocol: ${flow.protocol}`);
        }

        if (flow.isEncrypted) {
            parts.push('Encrypted');
        }

        if (flow.isPublicNetwork) {
            parts.push('Public Network');
        }

        if (parts.length === 0) {
            return 'Data flow between components';
        }

        return parts.join(' | ');
    }

    /**
     * Build project description with extraction statistics
     * @param {DFDIR} dfdir
     * @param {Object} stats
     * @returns {string}
     */
    buildProjectDescription(dfdir, stats) {
        const avgConf = stats.averageConfidence.elements;
        const lines = [
            'Auto-generated threat model from OTP document using T2T import.',
            '',
            `Extraction Statistics:`,
            `- Elements: ${stats.totalElements} (${stats.actors} actors, ${stats.processes} processes, ${stats.stores} stores)`,
            `- Flows: ${stats.totalFlows}`,
            `- Average Confidence: ${avgConf}%`,
            `- Extraction Sources: ${stats.extractionSources.join(', ')}`,
            '',
            'Please review and validate all extracted entities before conducting threat analysis.'
        ];

        return lines.join('\n');
    }

    /**
     * Get stroke color based on element confidence
     * @param {DFDElement} element
     * @returns {string} - Hex color
     */
    getStrokeColor(element) {
        // High confidence (>85): normal color
        if (element.confidence >= 85) {
            return '#333333';
        }

        // Medium confidence (70-84): amber
        if (element.confidence >= 70) {
            return '#FFA726';
        }

        // Low confidence (<70): red
        return '#E53935';
    }

    /**
     * Validate converted threat model using unified validation service
     * @param {Object} threatModel
     * @returns {Object} - { valid, errors }
     */
    validateThreatModel(threatModel) {
        // Use unified validation service
        const result = validationService.validateThreatModel(threatModel);

        // Also validate cells specifically for X6 rendering
        if (threatModel.detail?.diagrams) {
            threatModel.detail.diagrams.forEach((diagram, index) => {
                if (diagram.cells) {
                    const cellResult = validateCellsForRender(diagram.cells);
                    result.merge(cellResult);
                }
            });
        }

        // Log validation result for debugging
        validationService.logResult(result);

        // Return in legacy format for backward compatibility
        return {
            valid: result.valid,
            errors: result.errors.map(e => e.message),
            warnings: result.warnings.map(w => w.message),
            fullResult: result // Include full result for advanced usage
        };
    }

    /**
     * Convert and validate in one step
     * @param {DFDIR} dfdir
     * @param {Object} options
     * @returns {Object} - { threatModel, validation }
     */
    convertAndValidate(dfdir, options = {}) {
        const threatModel = this.convert(dfdir, options);
        const validation = this.validateThreatModel(threatModel);

        return {
            threatModel,
            validation
        };
    }

    /**
     * Export to JSON string
     * @param {Object} threatModel
     * @param {boolean} pretty - Pretty print
     * @returns {string}
     */
    exportJSON(threatModel, pretty = true) {
        return JSON.stringify(threatModel, null, pretty ? 2 : 0);
    }

    /**
     * Import from JSON string
     * @param {string} jsonString
     * @returns {Object}
     */
    importJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error(`JSON parsing failed: ${error.message}`);
        }
    }
}

export default T2TConverter;

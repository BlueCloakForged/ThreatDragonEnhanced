/**
 * DFD Intermediate Representation (DFDIR)
 * Format-agnostic data structure for Data Flow Diagrams
 *
 * This module defines the core data models used to represent
 * threat model diagrams extracted from OTP documents before
 * conversion to Threat Dragon's JSON format.
 */

/**
 * Represents a single element in a DFD (Process, Store, or Actor)
 */
export class DFDElement {
    constructor({
        id,
        name,
        type,
        x = 100,
        y = 100,
        ipAddress = null,
        services = [],
        metadata = {},
        confidence = 100,
        source = 'manual'
    }) {
        this.id = id;
        this.name = name;
        this.type = type; // 'actor', 'process', 'store'
        this.x = x;
        this.y = y;
        this.ipAddress = ipAddress;
        this.services = services;
        this.metadata = metadata;
        this.confidence = confidence; // 0-100
        this.source = source; // 'text', 'vision', 'manual'
    }

    /**
   * Validate this element
   * @returns {string[]} Array of validation error messages
   */
    validate() {
        const errors = [];

        if (!this.id) {
            errors.push('Element missing ID');
        }

        if (!this.name || this.name.trim() === '') {
            errors.push('Element missing name');
        }

        if (!['actor', 'process', 'store'].includes(this.type)) {
            errors.push(`Invalid element type: ${this.type}`);
        }

        if (typeof this.x !== 'number' || typeof this.y !== 'number') {
            errors.push('Element position must be numeric');
        }

        if (typeof this.confidence !== 'number' || this.confidence < 0 || this.confidence > 100) {
            errors.push('Confidence must be between 0 and 100');
        }

        return errors;
    }

    /**
   * Create a copy of this element
   */
    clone() {
        return new DFDElement({
            id: this.id,
            name: this.name,
            type: this.type,
            x: this.x,
            y: this.y,
            ipAddress: this.ipAddress,
            services: [...this.services],
            metadata: { ...this.metadata },
            confidence: this.confidence,
            source: this.source
        });
    }

    /**
   * Serialize to JSON
   */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            x: this.x,
            y: this.y,
            ipAddress: this.ipAddress,
            services: this.services,
            metadata: this.metadata,
            confidence: this.confidence,
            source: this.source
        };
    }
}

/**
 * Represents a data flow connection between two elements
 */
export class DFDFlow {
    constructor({
        id,
        sourceId,
        targetId,
        protocol = 'HTTPS',
        isEncrypted = true,
        isPublicNetwork = false,
        metadata = {},
        confidence = 100,
        source = 'manual'
    }) {
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.protocol = protocol;
        this.isEncrypted = isEncrypted;
        this.isPublicNetwork = isPublicNetwork;
        this.metadata = metadata;
        this.confidence = confidence;
        this.source = source;
    }

    /**
   * Validate this flow
   * @returns {string[]} Array of validation error messages
   */
    validate() {
        const errors = [];

        if (!this.id) {
            errors.push('Flow missing ID');
        }

        if (!this.sourceId) {
            errors.push('Flow missing source ID');
        }

        if (!this.targetId) {
            errors.push('Flow missing target ID');
        }

        if (this.sourceId === this.targetId) {
            errors.push('Flow source and target cannot be the same');
        }

        if (typeof this.confidence !== 'number' || this.confidence < 0 || this.confidence > 100) {
            errors.push('Confidence must be between 0 and 100');
        }

        return errors;
    }

    /**
   * Create a copy of this flow
   */
    clone() {
        return new DFDFlow({
            id: this.id,
            sourceId: this.sourceId,
            targetId: this.targetId,
            protocol: this.protocol,
            isEncrypted: this.isEncrypted,
            isPublicNetwork: this.isPublicNetwork,
            metadata: { ...this.metadata },
            confidence: this.confidence,
            source: this.source
        });
    }

    /**
   * Serialize to JSON
   */
    toJSON() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            targetId: this.targetId,
            protocol: this.protocol,
            isEncrypted: this.isEncrypted,
            isPublicNetwork: this.isPublicNetwork,
            metadata: this.metadata,
            confidence: this.confidence,
            source: this.source
        };
    }
}

/**
 * Data Flow Diagram Intermediate Representation
 * Central data structure for representing extracted threat models
 */
export class DFDIR {
    constructor(name = 'Untitled') {
        this.name = name;
        this.elements = [];
        this.flows = [];
        this.metadata = {
            created: new Date().toISOString(),
            source: null,
            extractionMethod: null
        };
    }

    /**
   * Add an element to this DFDIR
   * @param {DFDElement} element
   */
    addElement(element) {
        if (!(element instanceof DFDElement)) {
            throw new Error('Must be DFDElement instance');
        }

        // Check for duplicate IDs
        if (this.elements.find(el => el.id === element.id)) {
            throw new Error(`Element with ID ${element.id} already exists`);
        }

        this.elements.push(element);
    }

    /**
   * Add a flow to this DFDIR
   * @param {DFDFlow} flow
   */
    addFlow(flow) {
        if (!(flow instanceof DFDFlow)) {
            throw new Error('Must be DFDFlow instance');
        }

        // Check for duplicate IDs
        if (this.flows.find(f => f.id === flow.id)) {
            throw new Error(`Flow with ID ${flow.id} already exists`);
        }

        this.flows.push(flow);
    }

    /**
   * Get element by ID
   * @param {string} id
   * @returns {DFDElement|null}
   */
    getElementById(id) {
        return this.elements.find(el => el.id === id) || null;
    }

    /**
   * Get flow by ID
   * @param {string} id
   * @returns {DFDFlow|null}
   */
    getFlowById(id) {
        return this.flows.find(f => f.id === id) || null;
    }

    /**
   * Remove element by ID
   * @param {string} id
   * @returns {boolean} True if removed, false if not found
   */
    removeElement(id) {
        const index = this.elements.findIndex(el => el.id === id);
        if (index === -1) return false;

        // Also remove any flows connected to this element
        this.flows = this.flows.filter(flow =>
            flow.sourceId !== id && flow.targetId !== id
        );

        this.elements.splice(index, 1);
        return true;
    }

    /**
   * Remove flow by ID
   * @param {string} id
   * @returns {boolean} True if removed, false if not found
   */
    removeFlow(id) {
        const index = this.flows.findIndex(f => f.id === id);
        if (index === -1) return false;

        this.flows.splice(index, 1);
        return true;
    }

    /**
   * Validate the entire DFDIR
   * @returns {Object} { valid: boolean, errors: string[] }
   */
    validate() {
        const errors = [];

        // Validate all elements
        this.elements.forEach((element, index) => {
            const elementErrors = element.validate();
            if (elementErrors.length > 0) {
                errors.push(`Element ${index} (${element.name}): ${elementErrors.join(', ')}`);
            }
        });

        // Validate all flows
        this.flows.forEach((flow, index) => {
            const flowErrors = flow.validate();
            if (flowErrors.length > 0) {
                errors.push(`Flow ${index}: ${flowErrors.join(', ')}`);
            }

            // Check reference integrity
            const sourceExists = this.getElementById(flow.sourceId);
            const targetExists = this.getElementById(flow.targetId);

            if (!sourceExists) {
                errors.push(`Flow ${index}: Source element ${flow.sourceId} not found`);
            }

            if (!targetExists) {
                errors.push(`Flow ${index}: Target element ${flow.targetId} not found`);
            }
        });

        // Structural validations
        if (this.elements.length === 0) {
            errors.push('DFDIR contains no elements');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
   * Get statistics about this DFDIR
   */
    getStatistics() {
        const stats = {
            totalElements: this.elements.length,
            totalFlows: this.flows.length,
            actors: this.elements.filter(el => el.type === 'actor').length,
            processes: this.elements.filter(el => el.type === 'process').length,
            stores: this.elements.filter(el => el.type === 'store').length,
            elementsByType: {
                actor: this.elements.filter(el => el.type === 'actor').length,
                process: this.elements.filter(el => el.type === 'process').length,
                store: this.elements.filter(el => el.type === 'store').length
            },
            elementsBySource: {
                text: this.elements.filter(el => el.source === 'text').length,
                vision: this.elements.filter(el => el.source === 'vision').length,
                manual: this.elements.filter(el => el.source === 'manual').length
            },
            averageConfidence: {
                elements: this.elements.length > 0
                    ? Math.round(this.elements.reduce((sum, el) => sum + el.confidence, 0) / this.elements.length)
                    : 0,
                flows: this.flows.length > 0
                    ? Math.round(this.flows.reduce((sum, flow) => sum + flow.confidence, 0) / this.flows.length)
                    : 0
            },
            extractionSources: [...new Set(this.elements.map(el => el.source))],
            lowConfidenceElements: this.elements.filter(el => el.confidence < 70).length,
            lowConfidenceFlows: this.flows.filter(f => f.confidence < 70).length,
            missingIPs: this.elements.filter(el => !el.ipAddress).length
        };

        return stats;
    }

    /**
   * Serialize to JSON
   */
    toJSON() {
        return {
            name: this.name,
            elements: this.elements.map(el => el.toJSON()),
            flows: this.flows.map(f => f.toJSON()),
            metadata: this.metadata
        };
    }

    /**
   * Create DFDIR from JSON
   * @param {Object} json
   * @returns {DFDIR}
   */
    static fromJSON(json) {
        const dfdir = new DFDIR(json.name);
        dfdir.metadata = json.metadata || dfdir.metadata;

        json.elements.forEach(elData => {
            const element = new DFDElement(elData);
            dfdir.addElement(element);
        });

        json.flows.forEach(flowData => {
            const flow = new DFDFlow(flowData);
            dfdir.addFlow(flow);
        });

        return dfdir;
    }
}

/**
 * T2T Document Parser
 * Extracts text from PDF, DOCX, TXT, and MD files
 */

// PDF.js and mammoth are lazy-loaded to avoid import issues
let pdfjsLib = null;
let mammoth = null;

export class T2TParser {
    /**
     * Parse OTP document and extract text
     * @param {File} file - The document file to parse
     * @returns {Promise<Object>} - { text, metadata }
     */
    async parse(file) {
        const fileType = this.getFileExtension(file.name);

        switch (fileType) {
        case 'pdf':
            return await this.parsePDF(file);
        case 'docx':
            return await this.parseDOCX(file);
        case 'json':
            return await this.parseJSON(file);
        case 'txt':
        case 'md':
            return await this.parseText(file);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
        }
    }

    /**
     * Get file extension from filename
     * @param {string} filename
     * @returns {string} - lowercase extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Parse PDF document
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parsePDF(file) {
        try {
            // Lazy load pdfjs-dist only when needed
            if (!pdfjsLib) {
                pdfjsLib = await import('pdfjs-dist');
                // Use worker file from public folder (copied during build)
                // This avoids CDN fetches and webpack bundling issues
                pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            }

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';
            const pages = [];

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine text items into page text
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                pages.push({
                    pageNumber: pageNum,
                    text: pageText
                });

                fullText += pageText + '\n\n';
            }

            return {
                text: fullText,
                metadata: {
                    source: file.name,
                    type: 'pdf',
                    pages: pdf.numPages,
                    extractedPages: pages,
                    size: file.size,
                    extractedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`PDF parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse DOCX document
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parseDOCX(file) {
        try {
            // Lazy load mammoth only when needed
            if (!mammoth) {
                mammoth = await import('mammoth');
            }

            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });

            return {
                text: result.value,
                metadata: {
                    source: file.name,
                    type: 'docx',
                    size: file.size,
                    extractedAt: new Date().toISOString(),
                    messages: result.messages // Mammoth warnings/errors
                }
            };
        } catch (error) {
            throw new Error(`DOCX parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse JSON document with pre-extracted nodes and connections
     * Supports multiple formats:
     * - Simple: { nodes, connections }
     * - Threat Dragon v2: { summary, detail.diagrams[].diagramJson.cells[] }
     * - CRO JSON: { projects[].nodes, projects[].groups, projects[].connections }
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parseJSON(file) {
        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            // Detect JSON format and extract nodes/connections
            const formatInfo = this.detectJSONFormat(jsonData);
            const extracted = this.extractFromJSONFormat(jsonData, formatInfo.format);

            return {
                text: '', // No text extraction needed for JSON
                metadata: {
                    source: file.name,
                    type: 'json',
                    format: formatInfo.format,
                    formatDescription: formatInfo.description,
                    size: file.size,
                    extractedAt: new Date().toISOString(),
                    nodeCount: extracted.nodes.length,
                    connectionCount: extracted.connections.length
                },
                // Pass through the pre-extracted data
                preExtracted: extracted
            };
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${error.message}`);
            }
            throw new Error(`JSON parsing failed: ${error.message}`);
        }
    }

    /**
     * Detect the format of a JSON document
     * @param {Object} jsonData
     * @returns {Object} - { format, description }
     */
    detectJSONFormat(jsonData) {
        // Check for Threat Dragon v2 format
        if (jsonData.summary && jsonData.detail?.diagrams) {
            return {
                format: 'threatdragon',
                description: 'Threat Dragon v2 JSON (native or T2T Python export)'
            };
        }

        // Check for CRO JSON format
        if (jsonData.projects && Array.isArray(jsonData.projects)) {
            return {
                format: 'cro',
                description: 'CRO JSON (T2T Pipeline Agent export)'
            };
        }

        // Check for simple nodes/connections format
        if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
            return {
                format: 'simple',
                description: 'Simple nodes/connections JSON'
            };
        }

        throw new Error('Unrecognized JSON format. Expected: Threat Dragon v2, CRO JSON, or simple nodes/connections format.');
    }

    /**
     * Extract nodes and connections from different JSON formats
     * @param {Object} jsonData
     * @param {string} format
     * @returns {Object} - { nodes, connections }
     */
    extractFromJSONFormat(jsonData, format) {
        switch (format) {
        case 'threatdragon':
            return this.extractFromThreatDragonFormat(jsonData);
        case 'cro':
            return this.extractFromCROFormat(jsonData);
        case 'simple':
        default:
            return this.extractFromSimpleFormat(jsonData);
        }
    }

    /**
     * Extract from Threat Dragon v2 JSON format
     * @param {Object} jsonData
     * @returns {Object} - { nodes, connections }
     */
    extractFromThreatDragonFormat(jsonData) {
        const nodes = [];
        const connections = [];

        // Get cells from the first diagram
        const diagram = jsonData.detail?.diagrams?.[0];
        if (!diagram?.diagramJson?.cells) {
            throw new Error('No diagram cells found in Threat Dragon JSON');
        }

        const cells = diagram.diagramJson.cells;

        // Process cells
        for (const cell of cells) {
            if (cell.type === 'tm.Flow') {
                // This is a connection/flow
                connections.push({
                    id: cell.id,
                    sourceId: cell.source?.id,
                    targetId: cell.target?.id,
                    name: cell.labels?.[0]?.attrs?.text?.text || 'Data Flow',
                    protocol: cell.protocol || 'TCP',
                    isEncrypted: cell.isEncrypted || false,
                    isPublicNetwork: cell.isPublicNetwork || false,
                    confidence: 100,
                    metadata: {
                        extractedFrom: 'threatdragon-json',
                        hasOpenThreats: cell.hasOpenThreats || false,
                        threats: cell.threats || []
                    }
                });
            } else if (['tm.Process', 'tm.Store', 'tm.Actor', 'tm.Boundary'].includes(cell.type)) {
                // This is a node
                const nodeType = cell.type.replace('tm.', '').toLowerCase();
                nodes.push({
                    id: cell.id,
                    name: cell.attrs?.text?.text || 'Unknown',
                    type: nodeType,
                    ipAddress: null,
                    services: [],
                    position: cell.position,
                    size: cell.size,
                    confidence: 100,
                    metadata: {
                        extractedFrom: 'threatdragon-json',
                        hasOpenThreats: cell.hasOpenThreats || false,
                        outOfScope: cell.outOfScope || false,
                        threats: cell.threats || [],
                        // Preserve element-specific properties
                        ...(cell.privilegeLevel && { privilegeLevel: cell.privilegeLevel }),
                        ...(cell.storesCredentials !== undefined && { storesCredentials: cell.storesCredentials }),
                        ...(cell.isALog !== undefined && { isALog: cell.isALog }),
                        ...(cell.providesAuthentication !== undefined && { providesAuthentication: cell.providesAuthentication })
                    }
                });
            }
        }

        return { nodes, connections };
    }

    /**
     * Extract from CRO JSON format (T2T Pipeline Agent export)
     * @param {Object} jsonData
     * @returns {Object} - { nodes, connections }
     */
    extractFromCROFormat(jsonData) {
        const nodes = [];
        const connections = [];

        // Get the first project
        const project = jsonData.projects?.[0];
        if (!project) {
            throw new Error('No project found in CRO JSON');
        }

        // Map CRO roles to Threat Dragon types
        const roleToType = {
            attacker: 'actor',
            defender: 'process',
            router: 'process',
            firewall: 'process',
            switch: 'process',
            server: 'process',
            workstation: 'process',
            iot_device: 'process',
            ics_device: 'process',
            victim: 'actor',
            pivot: 'process',
            database: 'store'
        };

        // Create a map of CRO node IDs to our node IDs
        const nodeIdMap = new Map();

        // Process CRO nodes
        for (const croNode of (project.nodes || [])) {
            const nodeId = croNode.id;
            nodeIdMap.set(croNode.name, nodeId);

            // Determine type from role
            const role = croNode.role?.toLowerCase() || 'server';
            const type = roleToType[role] || 'process';

            // Extract IP from interfaces
            let ipAddress = null;
            if (croNode.interfaces?.length > 0) {
                ipAddress = croNode.interfaces[0].ip_address;
            }

            // Extract services
            const services = (croNode.services || []).map(s => s.name || s);

            nodes.push({
                id: nodeId,
                name: croNode.name,
                type: type,
                ipAddress: ipAddress,
                services: services,
                position: croNode.map_data ? { x: croNode.map_data.x, y: croNode.map_data.y } : null,
                size: croNode.map_data ? { width: croNode.map_data.width, height: croNode.map_data.height } : null,
                confidence: 100,
                metadata: {
                    extractedFrom: 'cro-json',
                    role: role,
                    operatingSystem: croNode.operating_system,
                    architecture: croNode.architecture,
                    parentGroup: croNode.parent_group,
                    templateId: croNode.template_id
                }
            });
        }

        // Process CRO connections
        for (const croConn of (project.connections || [])) {
            connections.push({
                id: croConn.id,
                sourceId: croConn.source_node,
                targetId: croConn.target_node,
                name: croConn.connection_type || 'network',
                protocol: 'TCP',
                isEncrypted: false,
                isPublicNetwork: false,
                confidence: 100,
                metadata: {
                    extractedFrom: 'cro-json',
                    bandwidth: croConn.bandwidth_mbps,
                    latency: croConn.latency_ms,
                    bidirectional: croConn.bidirectional
                }
            });
        }

        return { nodes, connections };
    }

    /**
     * Extract from simple nodes/connections format
     * @param {Object} jsonData
     * @returns {Object} - { nodes, connections }
     */
    extractFromSimpleFormat(jsonData) {
        if (!jsonData.nodes || !Array.isArray(jsonData.nodes)) {
            throw new Error('JSON must contain a "nodes" array');
        }
        if (!jsonData.connections || !Array.isArray(jsonData.connections)) {
            throw new Error('JSON must contain a "connections" array');
        }

        return {
            nodes: jsonData.nodes,
            connections: jsonData.connections
        };
    }

    /**
     * Parse plain text or markdown document
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parseText(file) {
        try {
            const text = await file.text();

            return {
                text,
                metadata: {
                    source: file.name,
                    type: this.getFileExtension(file.name),
                    size: file.size,
                    extractedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Text parsing failed: ${error.message}`);
        }
    }

    /**
     * Validate file before parsing
     * @param {File} file
     * @returns {Object} - { valid, errors }
     */
    validateFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { valid: false, errors };
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
        }

        // Check file type
        const ext = this.getFileExtension(file.name);
        const supportedTypes = ['pdf', 'docx', 'txt', 'md', 'json'];
        if (!supportedTypes.includes(ext)) {
            errors.push(`Unsupported file type: .${ext} (supported: ${supportedTypes.join(', ')})`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default new T2TParser();

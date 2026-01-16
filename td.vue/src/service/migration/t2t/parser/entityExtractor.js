/**
 * Entity Extractor
 * Extracts nodes and connections from OTP text using regex patterns
 *
 * Enhanced with patterns from T2T Pipeline Agent (entity_extractor.py)
 */

import { T2TPatterns, PatternHelpers, OS_PATTERNS, INSTRUMENTATION_PATTERNS } from './t2tPatterns.js';
import { v4 as uuidv4 } from 'uuid';

export class EntityExtractor {
    constructor() {
        this.nodes = new Map(); // Map<nodeName, nodeData>
        this.connections = [];
    }

    /**
     * Extract entities from OTP text
     * @param {string} text - Extracted text from document
     * @param {Object} visionResults - Optional vision/OCR results
     * @returns {Object} - { nodes, connections }
     */
    extract(text, visionResults = null) {
        this.nodes = new Map();
        this.connections = [];

        // Step 1: Extract nodes from text
        this.extractNodesFromText(text);

        // Step 2: Extract connections from text
        this.extractConnectionsFromText(text);

        // Step 3: If vision results provided, merge them
        if (visionResults) {
            this.mergeVisionResults(visionResults);
        }

        // Step 4: Calculate confidence scores
        this.calculateConfidence();

        return {
            nodes: Array.from(this.nodes.values()),
            connections: this.connections
        };
    }

    /**
     * Extract nodes from text using multiple patterns
     * @param {string} text
     */
    extractNodesFromText(text) {
        // Pattern 1: Markdown table rows
        this.extractFromTableRows(text);

        // Pattern 2: Inline format (NodeName (IP))
        this.extractFromInlineFormat(text);

        // Pattern 3: Common system names without IPs
        this.extractFromSystemNames(text);
    }

    /**
     * Extract nodes from markdown table rows
     * Format: | Hostname | OS | Arch | IP | Role | Services |
     * @param {string} text
     */
    extractFromTableRows(text) {
        const matches = text.matchAll(T2TPatterns.nodePatterns.tableRow);

        for (const match of matches) {
            const [, hostname, ipAddress, role, servicesText] = match;

            if (!hostname || hostname.trim() === '') continue;

            const nodeId = this.getOrCreateNodeId(hostname);
            const services = PatternHelpers.extractServices(servicesText);
            const context = PatternHelpers.getContextWindow(text, hostname);
            const type = PatternHelpers.classifyNodeType(hostname, role, context);

            this.addOrUpdateNode({
                id: nodeId,
                name: hostname.trim(),
                ipAddress: ipAddress?.trim() || null,
                type,
                services,
                metadata: {
                    role: role?.trim(),
                    extractedFrom: 'table',
                    rawServices: servicesText?.trim()
                },
                confidence: 95, // High confidence for table data
                source: 'text'
            });
        }
    }

    /**
     * Extract nodes from inline format: NodeName (IP)
     * @param {string} text
     */
    extractFromInlineFormat(text) {
        const matches = text.matchAll(T2TPatterns.nodePatterns.inline);

        for (const match of matches) {
            const [, nodeName, ipAddress] = match;

            if (!nodeName || nodeName.trim() === '') continue;

            // Skip if already exists from table (table has higher precedence)
            const existingNode = this.nodes.get(nodeName.trim());
            if (existingNode && existingNode.metadata.extractedFrom === 'table') {
                continue;
            }

            const nodeId = this.getOrCreateNodeId(nodeName);
            const context = PatternHelpers.getContextWindow(text, nodeName);
            const type = PatternHelpers.classifyNodeType(nodeName, '', context);

            this.addOrUpdateNode({
                id: nodeId,
                name: nodeName.trim(),
                ipAddress: ipAddress.trim(),
                type,
                services: [],
                metadata: {
                    extractedFrom: 'inline'
                },
                confidence: 85,
                source: 'text'
            });
        }
    }

    /**
     * Extract common system names (fallback for nodes without IPs)
     * Uses enhanced OS_PATTERNS from T2T Pipeline Agent
     * @param {string} text
     */
    extractFromSystemNames(text) {
        const seenNames = new Set();

        // First, use enhanced OS patterns for better detection
        for (const { pattern, hint, role } of OS_PATTERNS) {
            const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
            for (const match of matches) {
                const nodeName = match[1].trim();
                const normalizedName = nodeName.toLowerCase();

                // Skip duplicates
                if (seenNames.has(normalizedName)) continue;
                seenNames.add(normalizedName);

                // Skip if already extracted by higher-confidence method
                if (this.nodes.has(nodeName)) continue;

                const nodeId = this.getOrCreateNodeId(nodeName);
                const context = PatternHelpers.getContextWindow(text, nodeName);
                const type = PatternHelpers.classifyNodeType(nodeName, role, context);

                this.addOrUpdateNode({
                    id: nodeId,
                    name: nodeName,
                    ipAddress: null,
                    type,
                    services: [],
                    metadata: {
                        extractedFrom: 'osPattern',
                        templateHint: hint,
                        defaultRole: role
                    },
                    confidence: 75, // Higher confidence with OS pattern match
                    source: 'text'
                });
            }
        }

        // Also check instrumentation patterns
        for (const { pattern, name, role } of INSTRUMENTATION_PATTERNS) {
            if (pattern.test(text)) {
                if (seenNames.has(name.toLowerCase())) continue;
                seenNames.add(name.toLowerCase());

                if (this.nodes.has(name)) continue;

                const nodeId = this.getOrCreateNodeId(name);
                const context = PatternHelpers.getContextWindow(text, name);
                const type = PatternHelpers.classifyNodeType(name, role, context);

                this.addOrUpdateNode({
                    id: nodeId,
                    name: name,
                    ipAddress: null,
                    type,
                    services: [],
                    metadata: {
                        extractedFrom: 'instrumentationPattern',
                        defaultRole: role
                    },
                    confidence: 70,
                    source: 'text'
                });
            }
        }

        // Fallback to legacy system names pattern
        const matches = text.matchAll(T2TPatterns.nodePatterns.systemNames);
        for (const match of matches) {
            const nodeName = match[0];

            // Skip duplicates
            if (seenNames.has(nodeName.toLowerCase())) continue;
            seenNames.add(nodeName.toLowerCase());

            // Skip if already extracted by higher-confidence method
            if (this.nodes.has(nodeName)) continue;

            const nodeId = this.getOrCreateNodeId(nodeName);
            const context = PatternHelpers.getContextWindow(text, nodeName);
            const type = PatternHelpers.classifyNodeType(nodeName, '', context);

            this.addOrUpdateNode({
                id: nodeId,
                name: nodeName.trim(),
                ipAddress: null,
                type,
                services: [],
                metadata: {
                    extractedFrom: 'systemName'
                },
                confidence: 65, // Lower confidence without IP
                source: 'text'
            });
        }
    }

    /**
     * Extract connections from text
     * @param {string} text
     */
    extractConnectionsFromText(text) {
        const nodeNames = Array.from(this.nodes.keys());

        // Try each connection pattern
        T2TPatterns.connectionPatterns.forEach((pattern, index) => {
            const matches = text.matchAll(pattern);

            for (const match of matches) {
                let sourceName, targetName;

                if (index === 3) {
                    // "pivot through X" pattern
                    targetName = match[1];
                    // Find the subject of the sentence (likely previous node mention)
                    const context = text.substring(Math.max(0, match.index - 200), match.index);
                    sourceName = this.findNearestNodeName(context, nodeNames);
                } else if (index === 4 || index === 5) {
                    // "access X" or "target X" patterns
                    targetName = match[1];
                    const context = text.substring(Math.max(0, match.index - 200), match.index);
                    sourceName = this.findNearestNodeName(context, nodeNames);
                } else {
                    // Standard patterns with source and target
                    sourceName = match[1];
                    targetName = match[2];
                }

                if (!sourceName || !targetName) continue;

                // Find nodes
                const sourceNode = this.nodes.get(sourceName);
                const targetNode = this.nodes.get(targetName);

                if (!sourceNode || !targetNode) continue;
                if (sourceNode.id === targetNode.id) continue; // Skip self-loops

                // Detect protocol from context
                const context = PatternHelpers.getContextWindow(text, `${sourceName} ${targetName}`);
                const protocol = PatternHelpers.detectProtocol(context);
                const isEncrypted = PatternHelpers.isEncryptedProtocol(protocol);

                // Check for duplicate connections
                const existingConnection = this.connections.find(conn =>
                    conn.sourceId === sourceNode.id && conn.targetId === targetNode.id
                );

                if (!existingConnection) {
                    this.connections.push({
                        id: uuidv4(),
                        sourceId: sourceNode.id,
                        targetId: targetNode.id,
                        protocol,
                        isEncrypted,
                        isPublicNetwork: false,
                        metadata: {
                            sourceNode: sourceName,
                            targetNode: targetName,
                            extractedFrom: 'text'
                        },
                        confidence: 80,
                        source: 'text'
                    });
                }
            }
        });
    }

    /**
     * Find nearest node name in text
     * @param {string} text
     * @param {string[]} nodeNames
     * @returns {string|null}
     */
    findNearestNodeName(text, nodeNames) {
        for (let i = nodeNames.length - 1; i >= 0; i--) {
            const nodeName = nodeNames[i];
            if (text.includes(nodeName)) {
                return nodeName;
            }
        }
        return null;
    }

    /**
     * Merge vision/OCR results with text extraction
     * @param {Object} visionResults
     */
    mergeVisionResults(visionResults) {
        if (!visionResults || !visionResults.nodes) return;

        visionResults.nodes.forEach(visionNode => {
            // Try to match with existing text-extracted node
            const existingNode = this.findNodeByNameOrIP(visionNode.name, visionNode.ipAddress);

            if (existingNode) {
                // Merge data (text data takes precedence)
                if (!existingNode.ipAddress && visionNode.ipAddress) {
                    existingNode.ipAddress = visionNode.ipAddress;
                }

                // Average confidence scores
                existingNode.confidence = Math.round(
                    (existingNode.confidence + visionNode.confidence) / 2
                );

                existingNode.metadata.visionConfirmed = true;
            } else {
                // Add new node from vision
                this.addOrUpdateNode({
                    ...visionNode,
                    source: 'vision',
                    confidence: visionNode.confidence * 0.9 // Slightly lower confidence for vision-only
                });
            }
        });

        // Merge vision connections
        if (visionResults.connections) {
            visionResults.connections.forEach(visionConn => {
                // Check if connection already exists
                const exists = this.connections.find(conn =>
                    conn.sourceId === visionConn.sourceId &&
                    conn.targetId === visionConn.targetId
                );

                if (!exists) {
                    this.connections.push({
                        ...visionConn,
                        source: 'vision',
                        confidence: visionConn.confidence * 0.8 // Lower confidence for vision-only
                    });
                }
            });
        }
    }

    /**
     * Find node by name or IP address
     * @param {string} name
     * @param {string} ipAddress
     * @returns {Object|null}
     */
    findNodeByNameOrIP(name, ipAddress) {
        for (const node of this.nodes.values()) {
            if (node.name === name) return node;
            if (ipAddress && node.ipAddress === ipAddress) return node;
        }
        return null;
    }

    /**
     * Get or create node ID
     * @param {string} nodeName
     * @returns {string}
     */
    getOrCreateNodeId(nodeName) {
        const existing = this.nodes.get(nodeName);
        return existing ? existing.id : uuidv4();
    }

    /**
     * Add or update node in collection
     * @param {Object} nodeData
     */
    addOrUpdateNode(nodeData) {
        const existing = this.nodes.get(nodeData.name);

        if (existing) {
            // Update existing node (merge data)
            Object.assign(existing, {
                ipAddress: nodeData.ipAddress || existing.ipAddress,
                services: [...new Set([...existing.services, ...nodeData.services])],
                metadata: { ...existing.metadata, ...nodeData.metadata },
                confidence: Math.max(existing.confidence, nodeData.confidence)
            });
        } else {
            this.nodes.set(nodeData.name, nodeData);
        }
    }

    /**
     * Calculate confidence scores for all entities
     */
    calculateConfidence() {
        // Adjust node confidence based on completeness
        for (const node of this.nodes.values()) {
            let adjustedConfidence = node.confidence;

            // Boost for having IP address
            if (node.ipAddress && PatternHelpers.isValidIPv4(node.ipAddress)) {
                adjustedConfidence += 5;
            } else {
                adjustedConfidence -= 15; // Penalty for missing IP
            }

            // Boost for having services
            if (node.services.length > 0) {
                adjustedConfidence += 5;
            }

            // Boost for role information
            if (node.metadata.role) {
                adjustedConfidence += 5;
            }

            node.confidence = Math.min(100, Math.max(0, adjustedConfidence));
        }

        // Adjust connection confidence
        this.connections.forEach(conn => {
            const sourceNode = Array.from(this.nodes.values()).find(n => n.id === conn.sourceId);
            const targetNode = Array.from(this.nodes.values()).find(n => n.id === conn.targetId);

            if (sourceNode && targetNode) {
                // Boost if both nodes have high confidence
                const avgNodeConfidence = (sourceNode.confidence + targetNode.confidence) / 2;
                conn.confidence = Math.round((conn.confidence + avgNodeConfidence) / 2);
            }
        });
    }
}

export default EntityExtractor;

/**
 * T2T Layout Engine
 * Positions nodes in logical arrangements for threat modeling diagrams
 *
 * Supports:
 * - Tiered layout (horizontal tiers: Actor → Process → Store)
 * - Radial layout (circular arrangement)
 * - Grid snap compliance (CRO requirement: coordinates in multiples of 100)
 */

export class T2TLayout {
    constructor(gridSnap = 100) {
        this.gridSnap = gridSnap;
        this.canvasWidth = 2000;
        this.canvasHeight = 1500;
    }

    /**
     * Calculate positions for all nodes using specified layout
     * @param {Array} nodes - Array of node objects
     * @param {Array} connections - Array of connection objects
     * @param {string} layoutType - 'tiered', 'radial', or 'hierarchical'
     * @returns {Array} - Nodes with updated x, y coordinates
     */
    calculateLayout(nodes, connections, layoutType = 'tiered') {
        switch (layoutType) {
        case 'tiered':
            return this.calculateTieredLayout(nodes, connections);
        case 'radial':
            return this.calculateRadialLayout(nodes);
        case 'hierarchical':
            return this.calculateHierarchicalLayout(nodes, connections);
        default:
            throw new Error(`Unknown layout type: ${layoutType}`);
        }
    }

    /**
     * Tiered layout: Arrange nodes in horizontal tiers
     * Tier 1 (top): Actors (external entities)
     * Tier 2 (middle): Processes (servers, routers, firewalls)
     * Tier 3 (bottom): Stores (databases, file systems)
     *
     * @param {Array} nodes
     * @returns {Array} - Positioned nodes
     */
    calculateTieredLayout(nodes) {
        // Group nodes by type
        const tiers = {
            actor: [],
            process: [],
            store: []
        };

        nodes.forEach(node => {
            if (tiers[node.type]) {
                tiers[node.type].push(node);
            } else {
                // Default to process if unknown type
                tiers.process.push(node);
            }
        });

        const tierSpacing = 400; // Vertical spacing between tiers
        const nodeSpacing = 300; // Horizontal spacing between nodes
        let currentY = 100;

        // Position actors (top tier)
        this.positionTier(tiers.actor, 100, currentY, nodeSpacing);
        currentY += tierSpacing;

        // Position processes (middle tier)
        this.positionTier(tiers.process, 100, currentY, nodeSpacing);
        currentY += tierSpacing;

        // Position stores (bottom tier)
        this.positionTier(tiers.store, 100, currentY, nodeSpacing);

        return nodes;
    }

    /**
     * Position nodes in a horizontal tier
     * @param {Array} tierNodes - Nodes in this tier
     * @param {number} startX - Starting X coordinate
     * @param {number} y - Y coordinate for this tier
     * @param {number} spacing - Horizontal spacing between nodes
     */
    positionTier(tierNodes, startX, y, spacing) {
        if (tierNodes.length === 0) return;

        // Calculate total width needed
        const totalWidth = (tierNodes.length - 1) * spacing;

        // Center the tier horizontally
        const centerOffset = (this.canvasWidth - totalWidth) / 2;
        let currentX = Math.max(startX, centerOffset);

        tierNodes.forEach(node => {
            node.x = this.snapToGrid(currentX);
            node.y = this.snapToGrid(y);
            currentX += spacing;
        });
    }

    /**
     * Radial layout: Arrange nodes in a circle
     * Good for visualizing equal-level relationships
     *
     * @param {Array} nodes
     * @returns {Array} - Positioned nodes
     */
    calculateRadialLayout(nodes) {
        if (nodes.length === 0) return nodes;

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(centerX, centerY) - 200;

        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            node.x = this.snapToGrid(x);
            node.y = this.snapToGrid(y);
        });

        return nodes;
    }

    /**
     * Hierarchical layout: Tree-like structure based on connections
     * Useful for attack paths and dependency chains
     *
     * @param {Array} nodes
     * @param {Array} connections
     * @returns {Array} - Positioned nodes
     */
    calculateHierarchicalLayout(nodes, connections) {
        // Find root nodes (nodes with no incoming connections)
        const hasIncoming = new Set();

        connections.forEach(conn => {
            hasIncoming.add(conn.targetId);
        });

        const rootNodes = nodes.filter(node => !hasIncoming.has(node.id));

        // If no clear roots, fall back to tiered layout
        if (rootNodes.length === 0) {
            return this.calculateTieredLayout(nodes, connections);
        }

        // Build levels using BFS
        const levels = this.buildHierarchyLevels(nodes, connections, rootNodes);

        // Position nodes by level
        const levelSpacing = 400;
        const nodeSpacing = 300;
        let currentY = 100;

        levels.forEach(levelNodes => {
            this.positionTier(levelNodes, 100, currentY, nodeSpacing);
            currentY += levelSpacing;
        });

        return nodes;
    }

    /**
     * Build hierarchy levels using breadth-first search
     * @param {Array} nodes
     * @param {Array} connections
     * @param {Array} rootNodes
     * @returns {Array} - Array of levels, each containing nodes
     */
    buildHierarchyLevels(nodes, connections, rootNodes) {
        const levels = [];
        const visited = new Set();
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        let currentLevel = [...rootNodes];

        while (currentLevel.length > 0) {
            // Add current level
            const levelNodes = currentLevel.filter(node => !visited.has(node.id));
            if (levelNodes.length > 0) {
                levels.push(levelNodes);
                levelNodes.forEach(node => visited.add(node.id));
            }

            // Find next level (all targets of current level)
            const nextLevel = [];
            currentLevel.forEach(node => {
                const outgoing = connections.filter(conn => conn.sourceId === node.id);
                outgoing.forEach(conn => {
                    const targetNode = nodeMap.get(conn.targetId);
                    if (targetNode && !visited.has(targetNode.id)) {
                        nextLevel.push(targetNode);
                    }
                });
            });

            currentLevel = nextLevel;

            // Safety: prevent infinite loops
            if (levels.length > 20) break;
        }

        // Add any remaining unvisited nodes to final level
        const unvisited = nodes.filter(node => !visited.has(node.id));
        if (unvisited.length > 0) {
            levels.push(unvisited);
        }

        return levels;
    }

    /**
     * Snap coordinate to grid (multiples of gridSnap)
     * @param {number} value
     * @returns {number}
     */
    snapToGrid(value) {
        return Math.round(value / this.gridSnap) * this.gridSnap;
    }

    /**
     * Detect and prevent node overlaps
     * @param {Array} nodes
     * @param {number} minDistance - Minimum distance between nodes
     * @returns {Array} - Adjusted nodes
     */
    preventOverlaps(nodes, minDistance = 200) {
        const adjusted = [...nodes];
        let hasOverlap = true;
        let iterations = 0;
        const maxIterations = 100;

        while (hasOverlap && iterations < maxIterations) {
            hasOverlap = false;
            iterations++;

            for (let i = 0; i < adjusted.length; i++) {
                for (let j = i + 1; j < adjusted.length; j++) {
                    const node1 = adjusted[i];
                    const node2 = adjusted[j];

                    const dx = node2.x - node1.x;
                    const dy = node2.y - node1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        hasOverlap = true;

                        // Push nodes apart
                        const angle = Math.atan2(dy, dx);
                        const pushDistance = (minDistance - distance) / 2;

                        node1.x -= pushDistance * Math.cos(angle);
                        node1.y -= pushDistance * Math.sin(angle);
                        node2.x += pushDistance * Math.cos(angle);
                        node2.y += pushDistance * Math.sin(angle);

                        // Snap to grid
                        node1.x = this.snapToGrid(node1.x);
                        node1.y = this.snapToGrid(node1.y);
                        node2.x = this.snapToGrid(node2.x);
                        node2.y = this.snapToGrid(node2.y);
                    }
                }
            }
        }

        return adjusted;
    }

    /**
     * Calculate bounding box for a set of nodes
     * @param {Array} nodes
     * @returns {Object} - { minX, minY, maxX, maxY, width, height }
     */
    calculateBoundingBox(nodes) {
        if (nodes.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }

        const minX = Math.min(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxX = Math.max(...nodes.map(n => n.x));
        const maxY = Math.max(...nodes.map(n => n.y));

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Center diagram in canvas
     * @param {Array} nodes
     * @returns {Array} - Centered nodes
     */
    centerDiagram(nodes) {
        const bbox = this.calculateBoundingBox(nodes);

        const offsetX = (this.canvasWidth - bbox.width) / 2 - bbox.minX;
        const offsetY = (this.canvasHeight - bbox.height) / 2 - bbox.minY;

        nodes.forEach(node => {
            node.x = this.snapToGrid(node.x + offsetX);
            node.y = this.snapToGrid(node.y + offsetY);
        });

        return nodes;
    }
}

export default T2TLayout;

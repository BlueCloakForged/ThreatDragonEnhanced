<template>
    <div class="t2t-layout-selector">
        <h5>Select Layout Algorithm</h5>
        <p class="text-muted">
            Choose how nodes should be arranged in the diagram. Each layout offers different visual organization.
        </p>

        <!-- Layout Options -->
        <b-row>
            <b-col md="4" v-for="layout in layoutOptions" :key="layout.type">
                <b-card
                    :class="['layout-card', { selected: selectedLayout === layout.type }]"
                    @click="selectLayout(layout.type)"
                >
                    <div class="layout-icon mb-3">
                        <i :class="layout.icon"></i>
                    </div>
                    <h6>{{ layout.name }}</h6>
                    <p class="small text-muted mb-3">{{ layout.description }}</p>

                    <div class="layout-preview">
                        <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
                            <component
                                :is="'svg'"
                                v-html="layout.previewSVG"
                            ></component>
                        </svg>
                    </div>

                    <div class="mt-3">
                        <b-badge variant="secondary" class="mr-1">
                            <i class="fas fa-clock mr-1"></i>
                            {{ layout.complexity }}
                        </b-badge>
                        <b-badge variant="info">
                            {{ layout.bestFor }}
                        </b-badge>
                    </div>

                    <div v-if="selectedLayout === layout.type" class="selected-badge">
                        <i class="fas fa-check-circle"></i>
                        Selected
                    </div>
                </b-card>
            </b-col>
        </b-row>

        <!-- Selected Layout Info -->
        <b-alert v-if="selectedLayout" variant="info" show class="mt-4">
            <div class="d-flex align-items-start">
                <i class="fas fa-info-circle fa-2x mr-3"></i>
                <div>
                    <strong>{{ currentLayout.name }} Layout</strong>
                    <p class="mb-2 mt-1">{{ currentLayout.fullDescription }}</p>
                    <p class="mb-0 small">
                        <strong>Best for:</strong> {{ currentLayout.useCase }}
                    </p>
                </div>
            </div>
        </b-alert>

        <!-- Preview Stats -->
        <div v-if="previewStats" class="stats-grid mt-3">
            <div class="stat-item">
                <div class="stat-label">Nodes</div>
                <div class="stat-value">{{ previewStats.nodes }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Flows</div>
                <div class="stat-value">{{ previewStats.flows }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Canvas Size</div>
                <div class="stat-value">2000 × 1500</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Grid Snap</div>
                <div class="stat-value">100px</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'T2TLayoutSelector',
    props: {
        nodes: {
            type: Array,
            required: true
        },
        flows: {
            type: Array,
            required: true
        },
        selectedLayout: {
            type: String,
            default: 'tiered'
        }
    },
    data() {
        return {
            layoutOptions: [
                {
                    type: 'tiered',
                    name: 'Tiered',
                    icon: 'fas fa-layer-group fa-3x',
                    description: 'Horizontal tiers based on node types',
                    fullDescription: 'Arranges nodes in horizontal tiers: Actors at the top, Processes in the middle, and Stores at the bottom. This layout makes it easy to see the data flow from external entities through systems to data stores.',
                    complexity: 'Fast',
                    bestFor: 'Structured flows',
                    useCase: 'Standard enterprise architectures, layered systems, and traditional threat models',
                    previewSVG: `
                        <!-- Actors (top) -->
                        <circle cx="50" cy="30" r="8" fill="#007bff" opacity="0.7" />
                        <circle cx="100" cy="30" r="8" fill="#007bff" opacity="0.7" />
                        <circle cx="150" cy="30" r="8" fill="#007bff" opacity="0.7" />

                        <!-- Processes (middle) -->
                        <rect x="42" y="72" width="16" height="16" fill="#28a745" opacity="0.7" />
                        <rect x="92" y="72" width="16" height="16" fill="#28a745" opacity="0.7" />
                        <rect x="142" y="72" width="16" height="16" fill="#28a745" opacity="0.7" />

                        <!-- Stores (bottom) -->
                        <path d="M 42,122 L 58,122 L 58,132 L 50,138 L 42,132 Z" fill="#dc3545" opacity="0.7" />
                        <path d="M 92,122 L 108,122 L 108,132 L 100,138 L 92,132 Z" fill="#dc3545" opacity="0.7" />

                        <!-- Connections -->
                        <line x1="50" y1="38" x2="50" y2="72" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="100" y1="38" x2="100" y2="72" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="50" y1="88" x2="50" y2="122" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="100" y1="88" x2="100" y2="122" stroke="#666" stroke-width="1" opacity="0.5" />
                    `
                },
                {
                    type: 'radial',
                    name: 'Radial',
                    icon: 'fas fa-circle-notch fa-3x',
                    description: 'Circular arrangement around center',
                    fullDescription: 'Positions all nodes in a circle around the center of the canvas. This layout is useful when relationships are peer-to-peer or when you want to emphasize equal importance of all nodes.',
                    complexity: 'Fast',
                    bestFor: 'Equal relationships',
                    useCase: 'Peer-to-peer networks, microservices, or when no clear hierarchy exists',
                    previewSVG: `
                        <!-- Center circle (implicit) -->
                        <circle cx="100" cy="75" r="3" fill="#999" opacity="0.3" />

                        <!-- Nodes in circle -->
                        <circle cx="100" cy="30" r="8" fill="#007bff" opacity="0.7" />
                        <circle cx="145" cy="55" r="8" fill="#28a745" opacity="0.7" />
                        <circle cx="145" cy="95" r="8" fill="#dc3545" opacity="0.7" />
                        <circle cx="100" cy="120" r="8" fill="#007bff" opacity="0.7" />
                        <circle cx="55" cy="95" r="8" fill="#28a745" opacity="0.7" />
                        <circle cx="55" cy="55" r="8" fill="#dc3545" opacity="0.7" />

                        <!-- Connections -->
                        <line x1="100" y1="38" x2="137" y2="60" stroke="#666" stroke-width="1" opacity="0.3" />
                        <line x1="145" y1="63" x2="137" y2="87" stroke="#666" stroke-width="1" opacity="0.3" />
                        <line x1="137" y1="95" x2="108" y2="114" stroke="#666" stroke-width="1" opacity="0.3" />
                    `
                },
                {
                    type: 'hierarchical',
                    name: 'Hierarchical',
                    icon: 'fas fa-sitemap fa-3x',
                    description: 'Tree structure based on dependencies',
                    fullDescription: 'Creates a tree-like structure where root nodes (with no incoming connections) are at the top, and subsequent levels are arranged based on connection dependencies. Perfect for visualizing attack paths and dependency chains.',
                    complexity: 'Medium',
                    bestFor: 'Attack paths',
                    useCase: 'Attack trees, dependency graphs, and sequential penetration testing scenarios',
                    previewSVG: `
                        <!-- Level 0 (root) -->
                        <circle cx="100" cy="25" r="8" fill="#007bff" opacity="0.7" />

                        <!-- Level 1 -->
                        <rect x="42" y="57" width="16" height="16" fill="#28a745" opacity="0.7" />
                        <rect x="92" y="57" width="16" height="16" fill="#28a745" opacity="0.7" />
                        <rect x="142" y="57" width="16" height="16" fill="#28a745" opacity="0.7" />

                        <!-- Level 2 -->
                        <path d="M 42,102 L 58,102 L 58,112 L 50,118 L 42,112 Z" fill="#dc3545" opacity="0.7" />
                        <path d="M 92,102 L 108,102 L 108,112 L 100,118 L 92,112 Z" fill="#dc3545" opacity="0.7" />

                        <!-- Connections -->
                        <line x1="95" y1="33" x2="55" y2="57" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="100" y1="33" x2="100" y2="57" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="105" y1="33" x2="145" y2="57" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="50" y1="73" x2="50" y2="102" stroke="#666" stroke-width="1" opacity="0.5" />
                        <line x1="100" y1="73" x2="100" y2="102" stroke="#666" stroke-width="1" opacity="0.5" />
                    `
                }
            ]
        };
    },
    computed: {
        currentLayout() {
            return this.layoutOptions.find(l => l.type === this.selectedLayout);
        },
        previewStats() {
            if (!this.nodes) return null;
            return {
                nodes: this.nodes.length,
                flows: this.flows.length
            };
        }
    },
    methods: {
        selectLayout(type) {
            this.$emit('layout-selected', type);
        }
    }
};
</script>

<style scoped>
.layout-card {
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid #dee2e6;
    position: relative;
    min-height: 400px;
}

.layout-card:hover {
    border-color: #007bff;
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
    transform: translateY(-2px);
}

.layout-card.selected {
    border-color: #28a745;
    background: #f0fff4;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.layout-icon {
    text-align: center;
    color: #007bff;
}

.layout-card.selected .layout-icon {
    color: #28a745;
}

.layout-preview {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 10px;
    min-height: 150px;
}

.layout-preview svg {
    width: 100%;
    height: auto;
}

.selected-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #28a745;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    padding: 15px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
}

.stat-item {
    text-align: center;
}

.stat-label {
    font-size: 0.75rem;
    color: #6c757d;
    text-transform: uppercase;
    margin-bottom: 5px;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #212529;
}
</style>

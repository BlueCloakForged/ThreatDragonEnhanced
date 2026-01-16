<template>
    <div class="t2t-node-table">
        <h5>Validate Extracted Nodes</h5>
        <p class="text-muted">
            Review and edit the extracted nodes. You can modify names, types, IP addresses, and remove incorrect entries.
        </p>

        <!-- Filter Controls -->
        <div class="filter-controls mb-3">
            <b-row>
                <b-col md="6">
                    <b-input-group>
                        <b-input-group-prepend>
                            <b-input-group-text>
                                <i class="fas fa-search"></i>
                            </b-input-group-text>
                        </b-input-group-prepend>
                        <b-form-input
                            v-model="searchQuery"
                            placeholder="Search nodes..."
                        ></b-form-input>
                    </b-input-group>
                </b-col>
                <b-col md="6">
                    <b-form-select v-model="typeFilter">
                        <option value="">All Types</option>
                        <option value="actor">Actors</option>
                        <option value="process">Processes</option>
                        <option value="store">Stores</option>
                    </b-form-select>
                </b-col>
            </b-row>
        </div>

        <!-- Statistics -->
        <div class="stats-bar mb-3">
            <b-badge variant="primary" class="mr-2">
                Total: {{ filteredNodes.length }}
            </b-badge>
            <b-badge variant="success" class="mr-2">
                High Confidence (≥85%): {{ highConfidenceCount }}
            </b-badge>
            <b-badge variant="warning" class="mr-2">
                Medium Confidence (70-84%): {{ mediumConfidenceCount }}
            </b-badge>
            <b-badge variant="danger">
                Low Confidence (&lt;70%): {{ lowConfidenceCount }}
            </b-badge>
        </div>

        <!-- Nodes Table -->
        <b-table
            :items="filteredNodes"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            striped
            hover
            responsive
            show-empty
        >
            <!-- Name Column -->
            <template #cell(name)="data">
                <b-form-input
                    v-model="data.item.name"
                    size="sm"
                    @change="emitUpdate"
                ></b-form-input>
            </template>

            <!-- Type Column -->
            <template #cell(type)="data">
                <b-form-select
                    v-model="data.item.type"
                    :options="typeOptions"
                    size="sm"
                    @change="emitUpdate"
                ></b-form-select>
            </template>

            <!-- IP Address Column -->
            <template #cell(ipAddress)="data">
                <b-form-input
                    v-model="data.item.ipAddress"
                    size="sm"
                    placeholder="e.g., 192.168.1.1"
                    @change="emitUpdate"
                ></b-form-input>
            </template>

            <!-- Services Column -->
            <template #cell(services)="data">
                <b-badge
                    v-for="(service, idx) in data.item.services"
                    :key="idx"
                    variant="info"
                    class="mr-1"
                >
                    {{ service }}
                </b-badge>
                <span v-if="!data.item.services || data.item.services.length === 0" class="text-muted small">
                    None
                </span>
            </template>

            <!-- Confidence Column -->
            <template #cell(confidence)="data">
                <b-progress
                    :value="data.item.confidence"
                    :variant="getConfidenceVariant(data.item.confidence)"
                    :max="100"
                    show-value
                    class="confidence-bar"
                ></b-progress>
            </template>

            <!-- Source Column -->
            <template #cell(source)="data">
                <b-badge
                    :variant="getSourceVariant(data.item.metadata?.extractedFrom)"
                    class="source-badge"
                >
                    {{ data.item.metadata?.extractedFrom || data.item.source }}
                </b-badge>
            </template>

            <!-- Actions Column -->
            <template #cell(actions)="data">
                <b-button
                    variant="outline-danger"
                    size="sm"
                    @click="removeNode(data.index)"
                    title="Remove node"
                >
                    <i class="fas fa-trash"></i>
                </b-button>
            </template>

            <!-- Empty State -->
            <template #empty>
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No nodes found matching your criteria</p>
                </div>
            </template>
        </b-table>

        <!-- Pagination -->
        <b-pagination
            v-if="filteredNodes.length > perPage"
            v-model="currentPage"
            :total-rows="filteredNodes.length"
            :per-page="perPage"
            align="center"
            class="mt-3"
        ></b-pagination>

        <!-- Add Node Button -->
        <div class="mt-3">
            <b-button
                variant="outline-primary"
                @click="addNode"
            >
                <i class="fas fa-plus mr-2"></i>
                Add Node Manually
            </b-button>
        </div>
    </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

export default {
    name: 'T2TNodeTable',
    props: {
        nodes: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            localNodes: [],
            searchQuery: '',
            typeFilter: '',
            currentPage: 1,
            perPage: 10,
            fields: [
                { key: 'name', label: 'Name', sortable: true },
                { key: 'type', label: 'Type', sortable: true },
                { key: 'ipAddress', label: 'IP Address', sortable: true },
                { key: 'services', label: 'Services' },
                { key: 'confidence', label: 'Confidence', sortable: true },
                { key: 'source', label: 'Source' },
                { key: 'actions', label: 'Actions' }
            ],
            typeOptions: [
                { value: 'actor', text: 'Actor (External Entity)' },
                { value: 'process', text: 'Process (System)' },
                { value: 'store', text: 'Store (Database)' }
            ]
        };
    },
    computed: {
        filteredNodes() {
            let filtered = this.localNodes;

            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(node =>
                    node.name.toLowerCase().includes(query) ||
                    (node.ipAddress && node.ipAddress.includes(query))
                );
            }

            // Filter by type
            if (this.typeFilter) {
                filtered = filtered.filter(node => node.type === this.typeFilter);
            }

            return filtered;
        },
        highConfidenceCount() {
            return this.localNodes.filter(n => n.confidence >= 85).length;
        },
        mediumConfidenceCount() {
            return this.localNodes.filter(n => n.confidence >= 70 && n.confidence < 85).length;
        },
        lowConfidenceCount() {
            return this.localNodes.filter(n => n.confidence < 70).length;
        }
    },
    watch: {
        nodes: {
            handler(newNodes) {
                this.localNodes = [...newNodes];
            },
            immediate: true,
            deep: true
        }
    },
    methods: {
        getConfidenceVariant(confidence) {
            if (confidence >= 85) return 'success';
            if (confidence >= 70) return 'warning';
            return 'danger';
        },
        getSourceVariant(source) {
            if (source === 'table') return 'success';
            if (source === 'inline') return 'primary';
            if (source === 'systemName') return 'secondary';
            return 'info';
        },
        removeNode(index) {
            // Find the actual index in localNodes (accounting for filtering)
            const nodeToRemove = this.filteredNodes[index];
            const actualIndex = this.localNodes.findIndex(n => n.id === nodeToRemove.id);

            if (actualIndex !== -1) {
                this.localNodes.splice(actualIndex, 1);
                this.emitUpdate();
            }
        },
        addNode() {
            const newNode = {
                id: uuidv4(),
                name: 'New Node',
                type: 'process',
                x: 100,
                y: 100,
                ipAddress: null,
                services: [],
                metadata: {
                    extractedFrom: 'manual'
                },
                confidence: 100,
                source: 'manual'
            };

            this.localNodes.push(newNode);
            this.emitUpdate();
        },
        emitUpdate() {
            this.$emit('nodes-updated', this.localNodes);
        }
    }
};
</script>

<style scoped>
.filter-controls {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
}

.stats-bar {
    display: flex;
    align-items: center;
    padding: 10px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
}

.confidence-bar {
    min-width: 100px;
}

.source-badge {
    font-size: 0.75rem;
    text-transform: uppercase;
}
</style>

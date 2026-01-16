<template>
    <div class="t2t-flow-table">
        <h5>Validate Extracted Flows</h5>
        <p class="text-muted">
            Review and edit the extracted data flows between nodes. You can modify protocols, encryption settings, and remove incorrect entries.
        </p>

        <!-- Statistics -->
        <div class="stats-bar mb-3">
            <b-badge variant="primary" class="mr-2">
                Total Flows: {{ localFlows.length }}
            </b-badge>
            <b-badge variant="success" class="mr-2">
                Encrypted: {{ encryptedCount }}
            </b-badge>
            <b-badge variant="warning">
                Unencrypted: {{ unencryptedCount }}
            </b-badge>
        </div>

        <!-- Flows Table -->
        <b-table
            :items="localFlows"
            :fields="fields"
            striped
            hover
            responsive
            show-empty
        >
            <!-- Source Column -->
            <template #cell(source)="data">
                <b-form-select
                    v-model="data.item.sourceId"
                    :options="nodeOptions"
                    size="sm"
                    @change="emitUpdate"
                >
                    <template #first>
                        <b-form-select-option :value="null" disabled>
                            Select source node...
                        </b-form-select-option>
                    </template>
                </b-form-select>
            </template>

            <!-- Target Column -->
            <template #cell(target)="data">
                <b-form-select
                    v-model="data.item.targetId"
                    :options="nodeOptions"
                    size="sm"
                    @change="emitUpdate"
                >
                    <template #first>
                        <b-form-select-option :value="null" disabled>
                            Select target node...
                        </b-form-select-option>
                    </template>
                </b-form-select>
            </template>

            <!-- Protocol Column -->
            <template #cell(protocol)="data">
                <b-form-input
                    v-model="data.item.protocol"
                    size="sm"
                    placeholder="e.g., HTTPS"
                    @change="emitUpdate"
                ></b-form-input>
            </template>

            <!-- Encrypted Column -->
            <template #cell(isEncrypted)="data">
                <b-form-checkbox
                    v-model="data.item.isEncrypted"
                    switch
                    @change="emitUpdate"
                >
                    {{ data.item.isEncrypted ? 'Yes' : 'No' }}
                </b-form-checkbox>
            </template>

            <!-- Public Network Column -->
            <template #cell(isPublicNetwork)="data">
                <b-form-checkbox
                    v-model="data.item.isPublicNetwork"
                    switch
                    @change="emitUpdate"
                >
                    {{ data.item.isPublicNetwork ? 'Yes' : 'No' }}
                </b-form-checkbox>
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

            <!-- Actions Column -->
            <template #cell(actions)="data">
                <b-button
                    variant="outline-danger"
                    size="sm"
                    @click="removeFlow(data.index)"
                    title="Remove flow"
                >
                    <i class="fas fa-trash"></i>
                </b-button>
            </template>

            <!-- Empty State -->
            <template #empty>
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exchange-alt fa-3x mb-3"></i>
                    <p>No flows extracted</p>
                    <p class="small">You can add flows manually or continue without flows</p>
                </div>
            </template>
        </b-table>

        <!-- Add Flow Button -->
        <div class="mt-3">
            <b-button
                variant="outline-primary"
                @click="addFlow"
                :disabled="nodes.length < 2"
            >
                <i class="fas fa-plus mr-2"></i>
                Add Flow Manually
            </b-button>
            <span v-if="nodes.length < 2" class="text-muted small ml-2">
                (Need at least 2 nodes to create flows)
            </span>
        </div>

        <!-- Validation Warnings -->
        <b-alert
            v-if="validationWarnings.length > 0"
            variant="warning"
            show
            class="mt-3"
        >
            <strong>Validation Warnings:</strong>
            <ul class="mb-0 mt-2">
                <li v-for="(warning, idx) in validationWarnings" :key="idx">
                    {{ warning }}
                </li>
            </ul>
        </b-alert>
    </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

export default {
    name: 'T2TFlowTable',
    props: {
        flows: {
            type: Array,
            required: true
        },
        nodes: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            localFlows: [],
            fields: [
                { key: 'source', label: 'Source Node' },
                { key: 'target', label: 'Target Node' },
                { key: 'protocol', label: 'Protocol' },
                { key: 'isEncrypted', label: 'Encrypted' },
                { key: 'isPublicNetwork', label: 'Public' },
                { key: 'confidence', label: 'Confidence' },
                { key: 'actions', label: 'Actions' }
            ]
        };
    },
    computed: {
        nodeOptions() {
            return this.nodes.map(node => ({
                value: node.id,
                text: `${node.name}${node.ipAddress ? ` (${node.ipAddress})` : ''}`
            }));
        },
        encryptedCount() {
            return this.localFlows.filter(f => f.isEncrypted).length;
        },
        unencryptedCount() {
            return this.localFlows.filter(f => !f.isEncrypted).length;
        },
        validationWarnings() {
            const warnings = [];

            this.localFlows.forEach((flow, index) => {
                // Check for orphaned flows (source/target not in nodes)
                const sourceExists = this.nodes.some(n => n.id === flow.sourceId);
                const targetExists = this.nodes.some(n => n.id === flow.targetId);

                if (!sourceExists) {
                    warnings.push(`Flow ${index + 1}: Source node not found`);
                }
                if (!targetExists) {
                    warnings.push(`Flow ${index + 1}: Target node not found`);
                }

                // Check for self-loops
                if (flow.sourceId === flow.targetId) {
                    warnings.push(`Flow ${index + 1}: Source and target are the same`);
                }
            });

            return warnings;
        }
    },
    watch: {
        flows: {
            handler(newFlows) {
                this.localFlows = [...newFlows];
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
        removeFlow(index) {
            this.localFlows.splice(index, 1);
            this.emitUpdate();
        },
        addFlow() {
            if (this.nodes.length < 2) return;

            const newFlow = {
                id: uuidv4(),
                sourceId: this.nodes[0].id,
                targetId: this.nodes[1].id,
                protocol: 'HTTPS',
                isEncrypted: true,
                isPublicNetwork: false,
                metadata: {
                    extractedFrom: 'manual'
                },
                confidence: 100,
                source: 'manual'
            };

            this.localFlows.push(newFlow);
            this.emitUpdate();
        },
        emitUpdate() {
            this.$emit('flows-updated', this.localFlows);
        }
    }
};
</script>

<style scoped>
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
</style>

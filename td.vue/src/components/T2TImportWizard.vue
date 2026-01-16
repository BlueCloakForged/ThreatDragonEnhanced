<template>
    <b-modal
        id="t2t-import-wizard"
        :title="wizardTitle"
        size="xl"
        hide-footer
        @hidden="resetWizard"
    >
        <!-- Progress Steps -->
        <div class="wizard-progress mb-4">
            <div class="steps">
                <div
                    v-for="(step, index) in steps"
                    :key="index"
                    class="step"
                    :class="{
                        active: currentStep === index,
                        completed: currentStep > index
                    }"
                >
                    <div class="step-number">
                        <span v-if="currentStep > index">✓</span>
                        <span v-else>{{ index + 1 }}</span>
                    </div>
                    <div class="step-label">{{ step.label }}</div>
                </div>
            </div>
        </div>

        <!-- Step Content -->
        <div class="wizard-content">
            <!-- Step 1: Upload -->
            <div v-show="currentStep === 0">
                <t2t-upload
                    @file-selected="handleFileSelected"
                    @file-parsed="handleFileParsed"
                    :parsing="parsing"
                />
            </div>

            <!-- Step 2: Validate Nodes -->
            <div v-show="currentStep === 1">
                <t2t-node-table
                    :nodes="extractedNodes"
                    @nodes-updated="handleNodesUpdated"
                />
            </div>

            <!-- Step 3: Validate Flows -->
            <div v-show="currentStep === 2">
                <t2t-flow-table
                    :flows="extractedFlows"
                    :nodes="validatedNodes"
                    @flows-updated="handleFlowsUpdated"
                />
            </div>

            <!-- Step 4: Select Layout -->
            <div v-show="currentStep === 3">
                <t2t-layout-selector
                    :nodes="validatedNodes"
                    :flows="validatedFlows"
                    :selected-layout="selectedLayout"
                    @layout-selected="handleLayoutSelected"
                />
            </div>

            <!-- Step 5: Preview & Import -->
            <div v-show="currentStep === 4">
                <t2t-preview
                    :threat-model="generatedThreatModel"
                    :validation="threatModelValidation"
                    :statistics="extractionStatistics"
                />
            </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="wizard-navigation mt-4">
            <div class="d-flex justify-content-between">
                <div>
                    <b-button
                        variant="secondary"
                        @click="previousStep"
                        :disabled="currentStep === 0"
                    >
                        <i class="fas fa-arrow-left mr-1"></i>
                        Previous
                    </b-button>
                </div>
                <div>
                    <b-button
                        variant="outline-secondary"
                        @click="$bvModal.hide('t2t-import-wizard')"
                        class="mr-2"
                    >
                        Cancel
                    </b-button>
                    <b-button
                        v-if="currentStep < steps.length - 1"
                        variant="primary"
                        @click="nextStep"
                        :disabled="!canProceedToNextStep"
                    >
                        Next
                        <i class="fas fa-arrow-right ml-1"></i>
                    </b-button>
                    <b-button
                        v-else
                        variant="success"
                        @click="importThreatModel"
                        :disabled="!canImport"
                    >
                        <i class="fas fa-check mr-1"></i>
                        Import
                    </b-button>
                </div>
            </div>
        </div>

        <!-- Error Alert -->
        <b-alert
            v-if="error"
            variant="danger"
            dismissible
            @dismissed="error = null"
            class="mt-3"
        >
            <strong>Error:</strong> {{ error }}
        </b-alert>
    </b-modal>
</template>

<script>
import T2TUpload from './T2TUpload.vue';
import T2TNodeTable from './T2TNodeTable.vue';
import T2TFlowTable from './T2TFlowTable.vue';
import T2TLayoutSelector from './T2TLayoutSelector.vue';
import T2TPreview from './T2TPreview.vue';

// Lazy load these to avoid import issues
// import { T2TLayout } from '@/service/migration/t2t/layout/t2tLayout.js';
// import { DFDIR, DFDElement, DFDFlow } from '@/service/migration/t2t/models/dfdir.js';
// import { T2TConverter } from '@/service/migration/t2t/converter/t2tConverter.js';

export default {
    name: 'T2TImportWizard',
    components: {
        't2t-upload': T2TUpload,
        't2t-node-table': T2TNodeTable,
        't2t-flow-table': T2TFlowTable,
        't2t-layout-selector': T2TLayoutSelector,
        't2t-preview': T2TPreview
    },
    mounted() {
        console.log('T2TImportWizard component mounted');
    },
    data() {
        return {
            currentStep: 0,
            steps: [
                { label: 'Upload OTP', key: 'upload' },
                { label: 'Validate Nodes', key: 'nodes' },
                { label: 'Validate Flows', key: 'flows' },
                { label: 'Select Layout', key: 'layout' },
                { label: 'Preview & Import', key: 'preview' }
            ],

            // File & Parsing
            selectedFile: null,
            parsedText: null,
            parsing: false,

            // Extraction
            extractedNodes: [],
            extractedFlows: [],

            // Validation
            validatedNodes: [],
            validatedFlows: [],

            // Layout
            selectedLayout: 'tiered',
            positionedNodes: [],

            // Final
            generatedThreatModel: null,
            threatModelValidation: null,
            extractionStatistics: null,

            // Error handling
            error: null
        };
    },
    computed: {
        wizardTitle() {
            return `T2T Import: ${this.steps[this.currentStep].label}`;
        },
        canProceedToNextStep() {
            switch (this.currentStep) {
            case 0: // Upload
                return this.parsedText !== null;
            case 1: // Validate Nodes
                return this.validatedNodes.length > 0;
            case 2: // Validate Flows
                return true; // Can proceed even with 0 flows
            case 3: // Select Layout
                return this.selectedLayout !== null;
            case 4: // Preview
                return this.generatedThreatModel !== null;
            default:
                return false;
            }
        },
        canImport() {
            return this.generatedThreatModel !== null &&
                   this.threatModelValidation?.valid === true;
        }
    },
    methods: {
        // File handling
        handleFileSelected(file) {
            this.selectedFile = file;
            this.error = null;
        },

        handleFileParsed({ text, nodes, connections }) {
            console.log('[T2TImportWizard] File parsed event received');
            console.log('  - Text length:', text?.length);
            console.log('  - Nodes:', nodes?.length);
            console.log('  - Connections:', connections?.length);

            this.parsedText = text;
            this.extractedNodes = nodes || [];
            this.extractedFlows = connections || [];
            this.validatedNodes = [...(nodes || [])]; // Initialize validated with extracted
            this.validatedFlows = [...(connections || [])];
            this.error = null;

            console.log('[T2TImportWizard] State updated:');
            console.log('  - extractedNodes:', this.extractedNodes.length);
            console.log('  - extractedFlows:', this.extractedFlows.length);
        },

        // Node validation
        handleNodesUpdated(nodes) {
            this.validatedNodes = nodes;
        },

        // Flow validation
        handleFlowsUpdated(flows) {
            this.validatedFlows = flows;
        },

        // Layout selection
        handleLayoutSelected(layoutType) {
            this.selectedLayout = layoutType;
        },

        // Navigation
        nextStep() {
            if (this.currentStep < this.steps.length - 1) {
                this.currentStep++;

                // Perform step-specific actions
                if (this.currentStep === 3) {
                    // Apply layout when entering layout step
                    this.applyLayout();
                } else if (this.currentStep === 4) {
                    // Generate threat model when entering preview step
                    this.generateThreatModel();
                }
            }
        },

        previousStep() {
            if (this.currentStep > 0) {
                this.currentStep--;
            }
        },

        // Layout application
        async applyLayout() {
            try {
                const { T2TLayout } = await import('@/service/migration/t2t/layout/t2tLayout.js');
                const layout = new T2TLayout();
                this.positionedNodes = layout.calculateLayout(
                    this.validatedNodes,
                    this.validatedFlows,
                    this.selectedLayout
                );
            } catch (err) {
                this.error = `Layout failed: ${err.message}`;
                console.error('Layout error:', err);
            }
        },

        // Threat model generation
        async generateThreatModel() {
            try {
                // Lazy load required classes
                const { DFDIR, DFDElement, DFDFlow } = await import('@/service/migration/t2t/models/dfdir.js');
                const { T2TConverter } = await import('@/service/migration/t2t/converter/t2tConverter.js');
                const ajv = await import('@/service/schema/ajv.js');

                // Build DFDIR
                const dfdir = new DFDIR(this.selectedFile?.name || 'T2T Import');
                dfdir.metadata.source = this.selectedFile?.name;
                dfdir.metadata.extractionMethod = 't2t-wizard';

                // Add positioned nodes
                this.positionedNodes.forEach(nodeData => {
                    dfdir.addElement(new DFDElement(nodeData));
                });

                // Add validated flows
                this.validatedFlows.forEach(flowData => {
                    dfdir.addFlow(new DFDFlow(flowData));
                });

                // Get statistics
                this.extractionStatistics = dfdir.getStatistics();

                // Convert to Threat Dragon format
                const converter = new T2TConverter();
                const { threatModel, validation } = converter.convertAndValidate(dfdir, {
                    diagramName: `${this.selectedFile?.name || 'Imported'} - Network Topology`,
                    diagramDescription: `Auto-generated from OTP using T2T import (${this.selectedLayout} layout)`,
                    projectName: this.selectedFile?.name || 'T2T Import',
                    projectOwner: 'Unknown',
                    includeMetadata: true
                });

                this.generatedThreatModel = threatModel;
                this.threatModelValidation = validation;

                // Validate against schema
                console.log('[T2TImportWizard] Generated threat model:', JSON.stringify(threatModel, null, 2));
                console.log('[T2TImportWizard] Validating against schema...');
                const isValidV2 = ajv.isV2(threatModel);
                console.log('[T2TImportWizard] Schema validation result:', isValidV2);

                if (!isValidV2) {
                    const errors = ajv.checkV2(threatModel);
                    console.error('[T2TImportWizard] Schema validation errors:', errors);
                }

                // Log first diagram cells for inspection
                if (threatModel.detail?.diagrams?.[0]?.cells) {
                    console.log('[T2TImportWizard] First diagram cells:',
                        JSON.stringify(threatModel.detail.diagrams[0].cells.slice(0, 2), null, 2));
                }

            } catch (err) {
                this.error = `Threat model generation failed: ${err.message}`;
                console.error('Generation error:', err);
            }
        },

        // Import
        importThreatModel() {
            if (!this.canImport) {
                this.error = 'Cannot import: validation failed';
                return;
            }

            try {
                // Emit event to parent with threat model
                this.$emit('threat-model-imported', this.generatedThreatModel);

                // Close modal
                this.$bvModal.hide('t2t-import-wizard');

                // Show success toast
                this.$toast.success('Threat model imported successfully!');

            } catch (err) {
                this.error = `Import failed: ${err.message}`;
                console.error('Import error:', err);
            }
        },

        // Reset wizard
        resetWizard() {
            this.currentStep = 0;
            this.selectedFile = null;
            this.parsedText = null;
            this.parsing = false;
            this.extractedNodes = [];
            this.extractedFlows = [];
            this.validatedNodes = [];
            this.validatedFlows = [];
            this.selectedLayout = 'tiered';
            this.positionedNodes = [];
            this.generatedThreatModel = null;
            this.threatModelValidation = null;
            this.extractionStatistics = null;
            this.error = null;
        }
    }
};
</script>

<style scoped>
.wizard-progress {
    padding: 20px 0;
}

.steps {
    display: flex;
    justify-content: space-between;
    position: relative;
}

.steps::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 10%;
    right: 10%;
    height: 2px;
    background: #dee2e6;
    z-index: 0;
}

.step {
    flex: 1;
    text-align: center;
    position: relative;
    z-index: 1;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #dee2e6;
    margin: 0 auto 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #6c757d;
    transition: all 0.3s;
}

.step.active .step-number {
    border-color: #007bff;
    background: #007bff;
    color: white;
}

.step.completed .step-number {
    border-color: #28a745;
    background: #28a745;
    color: white;
}

.step-label {
    font-size: 0.875rem;
    color: #6c757d;
}

.step.active .step-label {
    color: #007bff;
    font-weight: 600;
}

.step.completed .step-label {
    color: #28a745;
}

.wizard-content {
    min-height: 400px;
    padding: 20px 0;
}

.wizard-navigation {
    border-top: 1px solid #dee2e6;
    padding-top: 20px;
}
</style>

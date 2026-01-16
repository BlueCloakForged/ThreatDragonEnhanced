<template>
    <div class="t2t-import-page">
        <b-container fluid>
            <b-row class="mb-4">
                <b-col>
                    <h2>
                        <i class="fas fa-file-import mr-2"></i>
                        T2T Import - Test Plan to Topology
                    </h2>
                    <p class="lead text-muted">
                        Import Operational Test Plans (OTP) and automatically generate threat model diagrams
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col lg="8" class="mx-auto">
                    <b-card class="shadow-sm">
                        <div class="text-center mb-4">
                            <div class="logo-placeholder mb-3">
                                <img src="/baby_dragon_glasses_doc.svg" alt="Import Logo" class="import-logo" />
                            </div>
                            <h4>Welcome to Import</h4>
                            <p class="text-muted">
                                Transform your Operational Test Plans into interactive threat models
                            </p>
                        </div>

                        <b-row class="mb-4">
                            <b-col md="4" class="text-center mb-3">
                                <div class="feature-icon mb-2">
                                    <i class="fas fa-upload fa-2x text-info"></i>
                                </div>
                                <h6>Upload OTP</h6>
                                <p class="small text-muted">
                                    PDF, DOCX, TXT, or MD files
                                </p>
                            </b-col>
                            <b-col md="4" class="text-center mb-3">
                                <div class="feature-icon mb-2">
                                    <i class="fas fa-robot fa-2x text-success"></i>
                                </div>
                                <h6>Auto-Extract</h6>
                                <p class="small text-muted">
                                    Intelligent entity detection
                                </p>
                            </b-col>
                            <b-col md="4" class="text-center mb-3">
                                <div class="feature-icon mb-2">
                                    <i class="fas fa-check-circle fa-2x text-primary"></i>
                                </div>
                                <h6>Import</h6>
                                <p class="small text-muted">
                                    Ready-to-use threat model
                                </p>
                            </b-col>
                        </b-row>

                        <div class="text-center">
                            <b-button
                                variant="primary"
                                size="lg"
                                @click="showWizard"
                            >
                                <i class="fas fa-rocket mr-2"></i>
                                Start T2T Import Wizard
                            </b-button>
                        </div>

                        <hr class="my-4">

                        <div class="info-section">
                            <h6 class="mb-3">
                                <i class="fas fa-info-circle mr-2"></i>
                                How It Works
                            </h6>
                            <ol class="mb-0">
                                <li class="mb-2">
                                    <strong>Upload your OTP document</strong> containing network topology information
                                </li>
                                <li class="mb-2">
                                    <strong>Review extracted nodes</strong> (actors, processes, stores) and flows
                                </li>
                                <li class="mb-2">
                                    <strong>Choose a layout</strong> (tiered, radial, or hierarchical)
                                </li>
                                <li class="mb-2">
                                    <strong>Preview and import</strong> the generated threat model into Threat Dragon
                                </li>
                            </ol>
                        </div>

                        <b-alert variant="info" show class="mt-4 mb-0">
                            <div class="d-flex align-items-start">
                                <i class="fas fa-lightbulb fa-2x mr-3"></i>
                                <div>
                                    <strong>Best Results:</strong>
                                    <p class="mb-0">
                                        Use OTP documents with markdown tables containing hostnames, IP addresses, and network flow descriptions.
                                        See the <a href="https://github.com/OWASP/threat-dragon/issues/851" target="_blank">documentation</a> for format examples.
                                    </p>
                                </div>
                            </div>
                        </b-alert>
                    </b-card>

                    <!-- Quick Stats -->
                    <b-card class="mt-4 shadow-sm" bg-variant="light">
                        <h6 class="mb-3">
                            <i class="fas fa-chart-bar mr-2"></i>
                            Import Statistics
                        </h6>
                        <b-row>
                            <b-col md="3" class="text-center">
                                <div class="stat-number">~90%</div>
                                <div class="stat-label">Accuracy</div>
                            </b-col>
                            <b-col md="3" class="text-center">
                                <div class="stat-number">60→5</div>
                                <div class="stat-label">Minutes Saved</div>
                            </b-col>
                            <b-col md="3" class="text-center">
                                <div class="stat-number">4</div>
                                <div class="stat-label">Formats</div>
                            </b-col>
                            <b-col md="3" class="text-center">
                                <div class="stat-number">3</div>
                                <div class="stat-label">Layouts</div>
                            </b-col>
                        </b-row>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>

        <!-- T2T Wizard Modal -->
        <t2t-import-wizard ref="wizard" @threat-model-imported="handleImport" />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import isElectron from 'is-electron';
import { getProviderType } from '@/service/provider/providers.js';
import tmActions from '@/store/actions/threatmodel.js';
import T2TImportWizard from '@/components/T2TImportWizard.vue';

export default {
    name: 'T2TImport',
    components: {
        't2t-import-wizard': T2TImportWizard
    },
    computed: {
        ...mapState({
            providerType: (state) => {
                // For T2T imports, default to 'local' provider if none selected
                const selectedProvider = state.provider.selected || 'local';
                return getProviderType(selectedProvider);
            }
        })
    },
    methods: {
        showWizard() {
            this.$bvModal.show('t2t-import-wizard');
        },
        handleImport(threatModel) {

            try {
                // Save the threat model to the Vuex store
                this.$store.dispatch(tmActions.selected, threatModel);

                // Notify desktop app if running in Electron
                if (isElectron()) {
                    window.electronAPI.modelOpened(threatModel.summary.title);
                }

                // Prepare route parameters with the threat model title
                const params = Object.assign({}, this.$route.params, {
                    threatmodel: threatModel.summary.title
                });

                // Show success message
                this.$toast.success('Threat model imported successfully!');

                // Navigate to the threat model view
                this.$router.push({ name: `${this.providerType}ThreatModel`, params });

            } catch (e) {
                this.$toast.error('Failed to import threat model: ' + e.message);
                console.error('Import error:', e);
            }
        }
    }
};
</script>

<style scoped>
.t2t-import-page {
    padding: 30px 0;
}

.logo-placeholder {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.import-logo {
    width: 120px;
    height: 120px;
    object-fit: contain;
}

.feature-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 50%;
}

.info-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
}

.info-section ol {
    padding-left: 20px;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #007bff;
}

.stat-label {
    font-size: 0.875rem;
    color: #6c757d;
    text-transform: uppercase;
}

.shadow-sm {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
}
</style>

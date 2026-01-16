<template>
    <div class="t2t-preview">
        <h5>Preview & Import</h5>
        <p class="text-muted">
            Review the generated threat model before importing it into Threat Dragon.
        </p>

        <!-- Validation Status -->
        <b-alert
            :variant="validation && validation.valid ? 'success' : 'danger'"
            show
            class="mb-4"
        >
            <div class="d-flex align-items-center">
                <i
                    :class="[
                        'fa-2x mr-3',
                        validation && validation.valid ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'
                    ]"
                ></i>
                <div>
                    <strong v-if="validation && validation.valid">
                        Threat Model Valid - Ready to Import
                    </strong>
                    <strong v-else>
                        Validation Failed
                    </strong>
                    <p v-if="validation && !validation.valid" class="mb-0 mt-1">
                        {{ validation.errors.length }} error(s) found
                    </p>
                </div>
            </div>
        </b-alert>

        <!-- Validation Errors -->
        <b-alert v-if="validation && !validation.valid" variant="danger" show class="mb-4">
            <strong>Validation Errors:</strong>
            <ul class="mb-0 mt-2">
                <li v-for="(error, idx) in validation.errors" :key="idx">
                    {{ error }}
                </li>
            </ul>
        </b-alert>

        <!-- Extraction Statistics -->
        <div v-if="statistics" class="statistics-panel mb-4">
            <h6 class="mb-3">Extraction Statistics</h6>

            <b-row>
                <b-col md="3">
                    <div class="stat-box">
                        <div class="stat-icon actors">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-value">{{ statistics.actors }}</div>
                            <div class="stat-label">Actors</div>
                        </div>
                    </div>
                </b-col>
                <b-col md="3">
                    <div class="stat-box">
                        <div class="stat-icon processes">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-value">{{ statistics.processes }}</div>
                            <div class="stat-label">Processes</div>
                        </div>
                    </div>
                </b-col>
                <b-col md="3">
                    <div class="stat-box">
                        <div class="stat-icon stores">
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-value">{{ statistics.stores }}</div>
                            <div class="stat-label">Stores</div>
                        </div>
                    </div>
                </b-col>
                <b-col md="3">
                    <div class="stat-box">
                        <div class="stat-icon flows">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-value">{{ statistics.totalFlows }}</div>
                            <div class="stat-label">Flows</div>
                        </div>
                    </div>
                </b-col>
            </b-row>

            <b-row class="mt-3">
                <b-col md="6">
                    <div class="info-item">
                        <strong>Average Confidence:</strong>
                        <b-progress
                            :value="statistics.averageConfidence.elements"
                            :variant="getConfidenceVariant(statistics.averageConfidence.elements)"
                            :max="100"
                            show-value
                            class="mt-1"
                        ></b-progress>
                    </div>
                </b-col>
                <b-col md="6">
                    <div class="info-item">
                        <strong>Extraction Sources:</strong>
                        <div class="mt-1">
                            <b-badge
                                v-for="source in statistics.extractionSources"
                                :key="source"
                                variant="secondary"
                                class="mr-1"
                            >
                                {{ source }}
                            </b-badge>
                        </div>
                    </div>
                </b-col>
            </b-row>

            <b-row class="mt-3">
                <b-col>
                    <div class="info-grid">
                        <div class="info-cell">
                            <span class="label">Total Elements:</span>
                            <span class="value">{{ statistics.totalElements }}</span>
                        </div>
                        <div class="info-cell">
                            <span class="label">Low Confidence Elements:</span>
                            <span class="value">{{ statistics.lowConfidenceElements }}</span>
                        </div>
                        <div class="info-cell">
                            <span class="label">Missing IP Addresses:</span>
                            <span class="value">{{ statistics.missingIPs }}</span>
                        </div>
                    </div>
                </b-col>
            </b-row>
        </div>

        <!-- Threat Model Summary -->
        <div v-if="threatModel" class="model-summary mb-4">
            <h6 class="mb-3">Threat Model Details</h6>

            <b-card>
                <b-row>
                    <b-col md="6">
                        <dl class="mb-0">
                            <dt>Project Name</dt>
                            <dd>{{ threatModel.summary.title }}</dd>

                            <dt>Owner</dt>
                            <dd>{{ threatModel.summary.owner }}</dd>

                            <dt>Version</dt>
                            <dd>{{ threatModel.version }}</dd>
                        </dl>
                    </b-col>
                    <b-col md="6">
                        <dl class="mb-0">
                            <dt>Diagrams</dt>
                            <dd>{{ threatModel.detail.diagrams.length }}</dd>

                            <dt>Diagram Name</dt>
                            <dd>{{ threatModel.detail.diagrams[0]?.title || 'N/A' }}</dd>

                            <dt>Total Cells</dt>
                            <dd>{{ threatModel.detail.diagrams[0]?.cells.length || 0 }}</dd>
                        </dl>
                    </b-col>
                </b-row>

                <hr>

                <div class="description-box">
                    <strong>Description:</strong>
                    <pre class="mb-0 mt-2">{{ threatModel.summary.description }}</pre>
                </div>
            </b-card>
        </div>

        <!-- Cell Breakdown -->
        <div v-if="cellBreakdown" class="cell-breakdown mb-4">
            <h6 class="mb-3">Cell Breakdown</h6>

            <div class="cell-types-grid">
                <div
                    v-for="(count, type) in cellBreakdown"
                    :key="type"
                    class="cell-type-card"
                >
                    <div class="cell-type-icon" :class="getCellTypeClass(type)">
                        <i :class="getCellTypeIcon(type)"></i>
                    </div>
                    <div class="cell-type-info">
                        <div class="cell-type-count">{{ count }}</div>
                        <div class="cell-type-label">{{ formatCellType(type) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Import Instructions -->
        <b-card bg-variant="light" class="mt-4">
            <h6 class="mb-2">
                <i class="fas fa-info-circle mr-2"></i>
                What happens next?
            </h6>
            <ol class="mb-0">
                <li>Click "Import" to add this threat model to Threat Dragon</li>
                <li>The diagram will be created with all extracted nodes and flows</li>
                <li>You can continue editing and adding threats in Threat Dragon</li>
                <li>Review low-confidence elements (marked in amber/red) carefully</li>
            </ol>
        </b-card>
    </div>
</template>

<script>
export default {
    name: 'T2TPreview',
    props: {
        threatModel: {
            type: Object,
            default: null
        },
        validation: {
            type: Object,
            default: null
        },
        statistics: {
            type: Object,
            default: null
        }
    },
    computed: {
        cellBreakdown() {
            if (!this.threatModel || !this.threatModel.detail.diagrams[0]) {
                return null;
            }

            const cells = this.threatModel.detail.diagrams[0].cells;
            const breakdown = {};

            cells.forEach(cell => {
                const type = cell.shape || 'unknown';
                breakdown[type] = (breakdown[type] || 0) + 1;
            });

            return breakdown;
        }
    },
    methods: {
        getConfidenceVariant(confidence) {
            if (confidence >= 85) return 'success';
            if (confidence >= 70) return 'warning';
            return 'danger';
        },
        getCellTypeClass(type) {
            if (type === 'tm.Actor') return 'actor';
            if (type === 'tm.Process') return 'process';
            if (type === 'tm.Store') return 'store';
            if (type === 'tm.Flow') return 'flow';
            return 'unknown';
        },
        getCellTypeIcon(type) {
            if (type === 'tm.Actor') return 'fas fa-user';
            if (type === 'tm.Process') return 'fas fa-cog';
            if (type === 'tm.Store') return 'fas fa-database';
            if (type === 'tm.Flow') return 'fas fa-arrow-right';
            return 'fas fa-question';
        },
        formatCellType(type) {
            return type.replace('tm.', '');
        }
    }
};
</script>

<style scoped>
.statistics-panel {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
}

.stat-box {
    display: flex;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    gap: 15px;
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;
}

.stat-icon.actors { background: #007bff; }
.stat-icon.processes { background: #28a745; }
.stat-icon.stores { background: #dc3545; }
.stat-icon.flows { background: #6c757d; }

.stat-details {
    flex: 1;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #212529;
}

.stat-label {
    font-size: 0.875rem;
    color: #6c757d;
    text-transform: uppercase;
}

.info-item {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

.info-cell {
    background: #f8f9fa;
    padding: 10px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-cell .label {
    font-size: 0.875rem;
    color: #6c757d;
}

.info-cell .value {
    font-weight: bold;
    color: #212529;
}

.model-summary dl {
    font-size: 0.9rem;
}

.model-summary dt {
    font-weight: 600;
    color: #6c757d;
    font-size: 0.8rem;
    text-transform: uppercase;
    margin-top: 8px;
}

.model-summary dd {
    margin-bottom: 0;
    color: #212529;
}

.description-box {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
}

.description-box pre {
    white-space: pre-wrap;
    font-size: 0.875rem;
    color: #495057;
}

.cell-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
}

.cell-type-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.cell-type-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: white;
}

.cell-type-icon.actor { background: #007bff; }
.cell-type-icon.process { background: #28a745; }
.cell-type-icon.store { background: #dc3545; }
.cell-type-icon.flow { background: #6c757d; }

.cell-type-info {
    flex: 1;
}

.cell-type-count {
    font-size: 20px;
    font-weight: bold;
    color: #212529;
}

.cell-type-label {
    font-size: 0.75rem;
    color: #6c757d;
    text-transform: uppercase;
}
</style>

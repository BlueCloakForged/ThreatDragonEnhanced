<template>
    <div class="t2t-upload">
        <h5>Upload OTP Document</h5>
        <p class="text-muted">
            Upload an Operational Test Plan (OTP) document or pre-extracted JSON to import network topology.
            Supported formats: PDF, DOCX, TXT, MD, JSON
        </p>

        <!-- Drag & Drop Area -->
        <div
            class="upload-dropzone"
            :class="{ 'drag-over': isDragging, 'has-file': selectedFile }"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
        >
            <input
                ref="fileInput"
                type="file"
                accept=".pdf,.docx,.txt,.md,.json,application/json,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                @change="handleFileChange"
                style="display: none"
            >

            <div v-if="!selectedFile" class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt fa-3x mb-3 text-muted"></i>
                <p class="mb-2">
                    <strong>Drag and drop your OTP file here</strong>
                </p>
                <p class="text-muted small">or click to browse</p>
                <p class="text-muted small">
                    Supported: PDF, DOCX, TXT, MD, JSON (max 10MB)
                </p>
            </div>

            <div v-else class="file-info">
                <i class="fas fa-file fa-2x mb-2" :class="fileIconClass"></i>
                <p class="mb-1"><strong>{{ selectedFile.name }}</strong></p>
                <p class="text-muted small mb-2">
                    {{ formatFileSize(selectedFile.size) }} • {{ fileExtension.toUpperCase() }}
                </p>
                <b-button
                    variant="outline-danger"
                    size="sm"
                    @click.stop="removeFile"
                >
                    <i class="fas fa-times mr-1"></i>
                    Remove
                </b-button>
            </div>
        </div>

        <!-- Validation Errors -->
        <b-alert
            v-if="validationError"
            variant="danger"
            dismissible
            @dismissed="validationError = null"
            class="mt-3"
        >
            {{ validationError }}
        </b-alert>

        <!-- Parse Button -->
        <div v-if="selectedFile && !parsing && !parsed" class="mt-3">
            <b-button
                variant="primary"
                block
                @click="parseFile"
            >
                <i class="fas fa-cogs mr-2"></i>
                Extract Entities from Document
            </b-button>
        </div>

        <!-- Parsing Progress -->
        <div v-if="parsing" class="mt-3">
            <b-progress :value="100" animated class="mb-2"></b-progress>
            <p class="text-center text-muted">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Parsing {{ fileExtension.toUpperCase() }} document and extracting entities...
            </p>
        </div>

        <!-- Extraction Results -->
        <div v-if="parsed && extractionResults" class="mt-3">
            <b-alert variant="success" show>
                <div class="d-flex align-items-center">
                    <i class="fas fa-check-circle fa-2x mr-3"></i>
                    <div>
                        <strong>Extraction Complete!</strong>
                        <p class="mb-0 mt-1">
                            Found {{ extractionResults.nodes.length }} nodes and
                            {{ extractionResults.connections.length }} connections
                        </p>
                    </div>
                </div>
            </b-alert>

            <!-- Quick Stats -->
            <div class="stats-grid mt-3">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.actors }}</div>
                        <div class="stat-label">Actors</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.processes }}</div>
                        <div class="stat-label">Processes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.stores }}</div>
                        <div class="stat-label">Stores</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ extractionResults.connections.length }}</div>
                        <div class="stat-label">Flows</div>
                    </div>
                </div>
            </div>

            <!-- Confidence Badge -->
            <div class="mt-3 text-center">
                <b-badge
                    :variant="confidenceVariant"
                    class="p-2"
                >
                    Average Confidence: {{ avgConfidence }}%
                </b-badge>
            </div>
        </div>
    </div>
</template>

<script>
import { T2TParser } from '@/service/migration/t2t/parser/t2tParser.js';
import { EntityExtractor } from '@/service/migration/t2t/parser/entityExtractor.js';

export default {
    name: 'T2TUpload',
    props: {
        parsing: {
            type: Boolean,
            default: false
        }
    },
    mounted() {
        console.log('T2TUpload component mounted');
    },
    data() {
        return {
            selectedFile: null,
            isDragging: false,
            validationError: null,
            parsed: false,
            extractionResults: null
        };
    },
    computed: {
        fileExtension() {
            if (!this.selectedFile) return '';
            return this.selectedFile.name.split('.').pop().toLowerCase();
        },
        fileIconClass() {
            const ext = this.fileExtension;
            if (ext === 'pdf') return 'text-danger';
            if (ext === 'docx') return 'text-primary';
            return 'text-secondary';
        },
        stats() {
            if (!this.extractionResults) {
                return { actors: 0, processes: 0, stores: 0 };
            }

            const { nodes } = this.extractionResults;
            return {
                actors: nodes.filter(n => n.type === 'actor').length,
                processes: nodes.filter(n => n.type === 'process').length,
                stores: nodes.filter(n => n.type === 'store').length
            };
        },
        avgConfidence() {
            if (!this.extractionResults || !this.extractionResults.nodes.length) {
                return 0;
            }

            const sum = this.extractionResults.nodes.reduce((acc, node) => acc + node.confidence, 0);
            return Math.round(sum / this.extractionResults.nodes.length);
        },
        confidenceVariant() {
            if (this.avgConfidence >= 85) return 'success';
            if (this.avgConfidence >= 70) return 'warning';
            return 'danger';
        }
    },
    methods: {
        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        handleFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                this.selectFile(file);
            }
        },

        handleDragEnter() {
            this.isDragging = true;
        },

        handleDragOver() {
            this.isDragging = true;
        },

        handleDragLeave(event) {
            // Only set isDragging to false if we're leaving the dropzone itself
            if (event.target.classList.contains('upload-dropzone')) {
                this.isDragging = false;
            }
        },

        handleDrop(event) {
            this.isDragging = false;
            const file = event.dataTransfer.files[0];
            if (file) {
                this.selectFile(file);
            }
        },

        selectFile(file) {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.validationError = validation.errors.join(', ');
                return;
            }

            this.selectedFile = file;
            this.validationError = null;
            this.parsed = false;
            this.extractionResults = null;

            this.$emit('file-selected', file);
        },

        removeFile() {
            this.selectedFile = null;
            this.parsed = false;
            this.extractionResults = null;
            this.validationError = null;
            this.$refs.fileInput.value = '';
        },

        validateFile(file) {
            const errors = [];

            // Check file size (max 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                errors.push(`File too large: ${this.formatFileSize(file.size)} (max 10MB)`);
            }

            // Check file type
            const ext = file.name.split('.').pop().toLowerCase();
            const supportedTypes = ['pdf', 'docx', 'txt', 'md', 'json'];
            if (!supportedTypes.includes(ext)) {
                errors.push(`Unsupported file type: .${ext} (supported: ${supportedTypes.join(', ')})`);
            }

            return {
                valid: errors.length === 0,
                errors
            };
        },

        async parseFile() {
            if (!this.selectedFile) return;

            console.log('[T2TUpload] Starting file parse for:', this.selectedFile.name);
            this.$emit('update:parsing', true);

            try {
                // Parse document
                const parser = new T2TParser();
                console.log('[T2TUpload] Parsing document...');
                const parseResult = await parser.parse(this.selectedFile);
                const { text, preExtracted } = parseResult;

                let nodes, connections;

                // Check if JSON file with pre-extracted data
                if (preExtracted) {
                    console.log('[T2TUpload] Using pre-extracted data from JSON');
                    nodes = preExtracted.nodes;

                    // Map JSON connections to expected format
                    connections = preExtracted.connections.map(conn => ({
                        ...conn,
                        sourceId: conn.source || conn.sourceId,
                        targetId: conn.target || conn.targetId
                    }));
                } else {
                    // Extract entities from text
                    console.log('[T2TUpload] Parsed text length:', text.length);
                    console.log('[T2TUpload] First 500 chars:', text.substring(0, 500));
                    console.log('[T2TUpload] Extracting entities...');

                    const extractor = new EntityExtractor();
                    const extracted = extractor.extract(text);
                    nodes = extracted.nodes;
                    connections = extracted.connections;
                }

                console.log('[T2TUpload] Extraction complete:');
                console.log('  - Nodes:', nodes.length);
                console.log('  - Connections:', connections.length);
                console.log('  - Node details:', nodes);

                this.extractionResults = { nodes, connections };
                this.parsed = true;

                // Emit results to parent
                this.$emit('file-parsed', {
                    text: text || '',
                    nodes,
                    connections
                });

            } catch (error) {
                this.validationError = `Parsing failed: ${error.message}`;
                console.error('[T2TUpload] Parse error:', error);
                console.error('[T2TUpload] Error stack:', error.stack);
            } finally {
                this.$emit('update:parsing', false);
            }
        },

        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
    }
};
</script>

<style scoped>
.upload-dropzone {
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: #f8f9fa;
}

.upload-dropzone:hover {
    border-color: #007bff;
    background: #e7f3ff;
}

.upload-dropzone.drag-over {
    border-color: #28a745;
    background: #d4edda;
}

.upload-dropzone.has-file {
    border-color: #28a745;
    background: white;
}

.upload-placeholder {
    color: #6c757d;
}

.file-info {
    padding: 20px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
}

.stat-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.stat-icon {
    font-size: 24px;
    color: #007bff;
}

.stat-info {
    flex: 1;
}

.stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #212529;
}

.stat-label {
    font-size: 12px;
    color: #6c757d;
    text-transform: uppercase;
}
</style>

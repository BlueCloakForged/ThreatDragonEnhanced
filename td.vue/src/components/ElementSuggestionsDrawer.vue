<template>
    <b-card 
        v-if="showDrawer"
        class="mt-3 kb-suggestions-drawer"
        no-body
    >
        <b-card-header 
            header-tag="header" 
            class="p-1"
            role="tab"
        >
            <b-button
                v-b-toggle.kb-suggestions-collapse
                block
                variant="outline-secondary"
                class="text-left d-flex justify-content-between align-items-center"
            >
                <span>
                    <font-awesome-icon icon="lightbulb" class="mr-2 text-warning" />
                    {{ $t('kbSuggestions.title') }}
                    <b-badge variant="info" class="ml-2" v-if="totalSuggestions > 0">
                        {{ totalSuggestions }}
                    </b-badge>
                </span>
                <span class="when-open"><font-awesome-icon icon="chevron-up" /></span>
                <span class="when-closed"><font-awesome-icon icon="chevron-down" /></span>
            </b-button>
        </b-card-header>
        <b-collapse id="kb-suggestions-collapse" visible role="tabpanel">
            <b-card-body>
                <div v-if="loading" class="text-center py-3">
                    <b-spinner small variant="primary" />
                    <span class="ml-2">{{ $t('kbSuggestions.loading') }}</span>
                </div>
                <div v-else-if="totalSuggestions === 0" class="text-muted text-center py-2">
                    <font-awesome-icon icon="info-circle" class="mr-1" />
                    {{ $t('kbSuggestions.noSuggestions') }}
                </div>
                <div v-else>
                    <!-- CAPEC Suggestions -->
                    <div v-if="suggestions.capec.length > 0" class="mb-3">
                        <h6 class="text-primary mb-2">
                            <font-awesome-icon icon="shield-alt" class="mr-1" />
                            CAPEC Attack Patterns
                        </h6>
                        <div class="suggestion-list">
                            <div 
                                v-for="capec in suggestions.capec" 
                                :key="capec.id"
                                class="suggestion-item d-flex justify-content-between align-items-center p-2 mb-1"
                            >
                                <div class="suggestion-info">
                                    <b-badge variant="primary" class="mr-2">{{ capec.id }}</b-badge>
                                    <span class="suggestion-name">{{ capec.name }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- CWE Suggestions -->
                    <div v-if="suggestions.cwe.length > 0">
                        <h6 class="text-warning mb-2">
                            <font-awesome-icon icon="bug" class="mr-1" />
                            CWE Weaknesses
                        </h6>
                        <div class="suggestion-list">
                            <div 
                                v-for="cwe in suggestions.cwe" 
                                :key="cwe.id"
                                class="suggestion-item d-flex justify-content-between align-items-center p-2 mb-1"
                            >
                                <div class="suggestion-info">
                                    <b-badge variant="warning" class="mr-2">{{ cwe.id }}</b-badge>
                                    <span class="suggestion-name">{{ cwe.name }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Matched Rules Info -->
                    <div v-if="suggestions.matchedRules && suggestions.matchedRules.length > 0" class="mt-3">
                        <small class="text-muted">
                            <font-awesome-icon icon="info-circle" class="mr-1" />
                            {{ $t('kbSuggestions.matchedRules') }}: {{ suggestions.matchedRules.join(', ') }}
                        </small>
                    </div>
                </div>
            </b-card-body>
        </b-collapse>
    </b-card>
</template>

<style lang="scss" scoped>
.kb-suggestions-drawer {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}
.suggestion-list {
    max-height: 200px;
    overflow-y: auto;
}
.suggestion-item {
    background-color: #f8f9fa;
    border-radius: 4px;
    font-size: 0.9em;
}
.suggestion-item:hover {
    background-color: #e9ecef;
}
.suggestion-name {
    word-break: break-word;
}
.collapsed > .when-open,
.not-collapsed > .when-closed {
    display: none;
}
</style>

<script>
import { mapState } from 'vuex';
import suggestionEngine from '@/service/kb/suggestionEngine.js';

export default {
    name: 'TdElementSuggestionsDrawer',
    data() {
        return {
            suggestions: { capec: [], cwe: [], matchedRules: [] },
            loading: false
        };
    },
    computed: {
        ...mapState({
            cellRef: (state) => state.cell.ref,
            diagram: (state) => state.threatmodel.selectedDiagram
        }),
        showDrawer() {
            // Show drawer only for elements that can have threats
            if (!this.cellRef || !this.cellRef.data) return false;
            const type = this.cellRef.data.type || '';
            return !this.cellRef.data.outOfScope && 
                   !this.cellRef.data.isTrustBoundary && 
                   type !== 'tm.Text' &&
                   type !== 'tm.Boundary' &&
                   type !== 'tm.BoundaryBox';
        },
        totalSuggestions() {
            return (this.suggestions.capec?.length || 0) + (this.suggestions.cwe?.length || 0);
        }
    },
    watch: {
        cellRef: {
            handler() { this.loadSuggestions(); },
            immediate: true
        }
    },
    methods: {
        loadSuggestions() {
            if (!this.showDrawer) {
                this.suggestions = { capec: [], cwe: [], matchedRules: [] };
                return;
            }
            this.loading = true;
            try {
                const nodeData = this.buildNodeData();
                const context = this.buildContext();
                this.suggestions = suggestionEngine.getSuggestions(nodeData, context);
            } catch (e) {
                console.error('Failed to load KB suggestions:', e);
                this.suggestions = { capec: [], cwe: [], matchedRules: [] };
            } finally {
                this.loading = false;
            }
        },
        buildNodeData() {
            const data = this.cellRef.data || {};
            return {
                name: data.name || '',
                type: data.type || '',
                protocol: data.protocol || '',
                isEncrypted: data.isEncrypted || false,
                isWebApplication: data.isWebApplication || false,
                storesCredentials: data.storesCredentials || false,
                providesAuthentication: data.providesAuthentication || false,
                handlesCardPayment: data.handlesCardPayment || false
            };
        },
        buildContext() {
            const connections = this.getConnections();
            return {
                is_entrypoint: this.isEntryPoint(connections),
                connections
            };
        },
        getConnections() {
            if (!this.diagram || !this.diagram.cells) return [];
            const cellId = this.cellRef.id;
            return this.diagram.cells.filter(c => 
                c.data && c.data.type === 'tm.Flow' && 
                (c.source?.cell === cellId || c.target?.cell === cellId)
            );
        },
        isEntryPoint(connections) {
            // Check if this node receives connections from external/actor nodes
            if (!this.diagram || !this.diagram.cells) return false;
            const cellId = this.cellRef.id;
            for (const flow of connections) {
                if (flow.target?.cell === cellId && flow.source?.cell) {
                    const sourceCell = this.diagram.cells.find(c => c.id === flow.source.cell);
                    if (sourceCell && sourceCell.data && sourceCell.data.type === 'tm.Actor') {
                        return true;
                    }
                }
            }
            return false;
        }
    }
};
</script>


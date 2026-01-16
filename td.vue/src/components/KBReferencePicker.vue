<template>
    <div class="kb-reference-picker">
        <label class="kb-label">{{ label }}</label>
        
        <!-- Search Input -->
        <div class="kb-search-wrapper">
            <b-form-input
                v-model="searchQuery"
                :placeholder="searchPlaceholder"
                type="text"
                size="sm"
                @input="onSearch"
                @focus="showDropdown = true"
            />
            <div v-if="showDropdown && searchResults.length > 0" class="kb-dropdown">
                <div
                    v-for="item in searchResults"
                    :key="item.id"
                    class="kb-dropdown-item"
                    @click="addReference(item)"
                >
                    <span class="kb-item-id">{{ item.id }}</span>
                    <span class="kb-item-name">{{ item.name }}</span>
                </div>
            </div>
        </div>

        <!-- Selected References -->
        <div v-if="selectedRefs.length > 0" class="kb-selected-refs">
            <b-badge
                v-for="ref in selectedRefs"
                :key="ref.id"
                :variant="ref.confidence === 'confirmed' ? 'success' : 'secondary'"
                class="kb-ref-badge"
                @click="toggleConfidence(ref)"
            >
                {{ ref.id }}
                <span class="kb-ref-remove" @click.stop="removeReference(ref)">×</span>
            </b-badge>
        </div>
        
        <small class="text-muted">
            Click badge to toggle confidence ({{ type === 'cwe' ? 'CWE' : 'CAPEC' }})
        </small>
    </div>
</template>

<script>
import kbService from '@/service/kb/kbService';

export default {
    name: 'KBReferencePicker',
    props: {
        type: {
            type: String,
            required: true,
            validator: (val) => ['cwe', 'capec'].includes(val)
        },
        value: {
            type: Array,
            default: () => []
        },
        label: {
            type: String,
            default: 'References'
        }
    },
    data() {
        return {
            searchQuery: '',
            searchResults: [],
            showDropdown: false
        };
    },
    computed: {
        selectedRefs() {
            return this.value || [];
        },
        searchPlaceholder() {
            return this.type === 'cwe' 
                ? 'Search CWE (e.g., "CWE-89" or "SQL Injection")' 
                : 'Search CAPEC (e.g., "CAPEC-66" or "Buffer Overflow")';
        }
    },
    methods: {
        onSearch() {
            if (this.type === 'cwe') {
                this.searchResults = kbService.searchCWE(this.searchQuery, 10);
            } else {
                this.searchResults = kbService.searchCAPEC(this.searchQuery, 10);
            }
            this.showDropdown = true;
        },
        addReference(item) {
            // Don't add duplicates
            if (this.selectedRefs.find(r => r.id === item.id)) {
                this.showDropdown = false;
                this.searchQuery = '';
                return;
            }
            
            const newRef = {
                id: item.id,
                name: item.name,
                confidence: 'confirmed'
            };
            
            const updated = [...this.selectedRefs, newRef];
            this.$emit('input', updated);
            this.searchQuery = '';
            this.showDropdown = false;
        },
        removeReference(ref) {
            const updated = this.selectedRefs.filter(r => r.id !== ref.id);
            this.$emit('input', updated);
        },
        toggleConfidence(ref) {
            const updated = this.selectedRefs.map(r => {
                if (r.id === ref.id) {
                    return {
                        ...r,
                        confidence: r.confidence === 'confirmed' ? 'suggested' : 'confirmed'
                    };
                }
                return r;
            });
            this.$emit('input', updated);
        },
        hideDropdown() {
            // Delay to allow click events to fire
            setTimeout(() => {
                this.showDropdown = false;
            }, 200);
        }
    },
    mounted() {
        document.addEventListener('click', this.hideDropdown);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.hideDropdown);
    }
};
</script>

<style scoped>
.kb-reference-picker {
    margin-bottom: 1rem;
}
.kb-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.25rem;
}
.kb-search-wrapper {
    position: relative;
}
.kb-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    z-index: 1050;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.kb-dropdown-item {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}
.kb-dropdown-item:hover {
    background: #f8f9fa;
}
.kb-dropdown-item:last-child {
    border-bottom: none;
}
.kb-item-id {
    font-weight: 600;
    color: #0d6efd;
    margin-right: 0.5rem;
    font-size: 0.85rem;
}
.kb-item-name {
    color: #495057;
    font-size: 0.85rem;
}
.kb-selected-refs {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}
.kb-ref-badge {
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0.3rem 0.5rem;
}
.kb-ref-remove {
    margin-left: 0.25rem;
    font-weight: bold;
    cursor: pointer;
}
.kb-ref-remove:hover {
    color: #dc3545;
}
</style>


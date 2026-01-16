<template>
<b-card class="threat-card">
        <b-card-text>
            <b-row>
                <b-col>
                    <a href="javascript:void(0)" @click="threatSelected()" v-if="!!number">#{{ number }} {{ title || 'Unknown Threat' }}</a>
                    <a href="javascript:void(0)" @click="threatSelected()" v-else>{{ title || 'Unknown Threat' }}</a>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    {{ type }}
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <font-awesome-icon 
                        icon="check"
                        class="threat-icon gray-icon"
                        :title="status"
                        v-if="status === 'NotApplicable'" />
                    <font-awesome-icon 
                        icon="check"
                        class="threat-icon green-icon"
                        :title="status"
                        v-if="status === 'Mitigated'" />
                    <font-awesome-icon 
                        icon="exclamation-triangle"
                        class="threat-icon red-icon"
                        :title="status"
                        v-if="status === 'Open'" />

                    <font-awesome-icon
                        icon="circle"
                        class="threat-icon darkred-icon"
                        :title="severity"
                        v-if="severity === 'Critical'" />
                    <font-awesome-icon 
                        icon="circle"
                        class="threat-icon red-icon"
                        :title="severity"
                        v-if="severity === 'High'" />
                    <font-awesome-icon 
                        icon="circle"
                        class="threat-icon orange-icon"
                        :title="severity"
                        v-if="severity === 'Medium'" />
                    <font-awesome-icon 
                        icon="circle"
                        class="threat-icon yellow-icon"
                        :title="severity"
                        v-if="severity === 'Low'" />
                    <font-awesome-icon 
                        icon="circle"
                        class="threat-icon gray-icon"
                        :title="severity"
                        v-if="severity === 'TBD'" />
                </b-col>
                <b-col align-h="end">
                    <b-badge :v-if="!!modelType">{{ modelType }}</b-badge>
                </b-col>
            </b-row>
            <!-- KB Reference Badges -->
            <b-row v-if="hasKBReferences" class="mt-1">
                <b-col>
                    <b-badge
                        v-for="ref in capecRefs"
                        :key="ref.id"
                        variant="info"
                        class="mr-1 kb-badge"
                        :title="ref.name"
                    >{{ ref.id }}</b-badge>
                    <b-badge
                        v-for="ref in cweRefs"
                        :key="ref.id"
                        variant="warning"
                        class="mr-1 kb-badge"
                        :title="ref.name"
                    >{{ ref.id }}</b-badge>
                </b-col>
            </b-row>
            <b-row v-if="!hasKBReferences" class="mt-1">
                <b-col>
                    <small class="text-muted missing-kb-label">
                        <font-awesome-icon icon="question-circle" class="mr-1" />
                        No KB refs
                    </small>
                </b-col>
            </b-row>
        </b-card-text>
    </b-card>
</template>

<style lang="scss" scoped>
.threat-card {
    font-size: 14px;
}

.threat-title {
    margin-bottom: 5px;
}

.threat-icon {
    margin: 2px;
}

.green-icon {
    color: $green;
}

.darkred-icon {
    color: $firebrick;
}

.red-icon {
    color: $red;
}

.orange-icon {
    color: $darkorange;
}

.yellow-icon {
    color: $yellow;
}

.gray-icon {
    color: $gray;
}

.kb-badge {
    font-size: 0.7rem;
    cursor: help;
}

.missing-kb-label {
    font-size: 0.7rem;
    opacity: 0.6;
}

</style>

<script>
export default {
    name: 'TdGraphThreats',
    props: {
        id: { type: String },
        status: { type: String },
        severity: { type: String },
        description: { type: String },
        title: { type: String },
        type: { type: String },
        mitigation: { type: String },
        modelType: { type: String },
        number: { type: Number },
        references: { type: Object, default: () => ({ cwe: [], capec: [] }) }
    },
    computed: {
        cweRefs() {
            return this.references?.cwe || [];
        },
        capecRefs() {
            return this.references?.capec || [];
        },
        hasKBReferences() {
            return this.cweRefs.length > 0 || this.capecRefs.length > 0;
        }
    },
    methods: {
        threatSelected() {
            this.$emit('threatSelected', this.id,'old');
        }
    }
};

</script>
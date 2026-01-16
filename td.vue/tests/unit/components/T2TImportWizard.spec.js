import { shallowMount } from '@vue/test-utils';
import T2TImportWizard from '@/components/T2TImportWizard.vue';

describe('T2TImportWizard.vue', () => {
    it('should mount without errors', () => {
        const wrapper = shallowMount(T2TImportWizard, {
            stubs: {
                'b-modal': true,
                't2t-upload': true,
                't2t-node-table': true,
                't2t-flow-table': true,
                't2t-layout-selector': true,
                't2t-preview': true
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.vm.currentStep).toBe(0);
        expect(wrapper.vm.steps).toHaveLength(5);
    });

    it('should have correct step labels', () => {
        const wrapper = shallowMount(T2TImportWizard, {
            stubs: {
                'b-modal': true,
                't2t-upload': true,
                't2t-node-table': true,
                't2t-flow-table': true,
                't2t-layout-selector': true,
                't2t-preview': true
            }
        });

        expect(wrapper.vm.steps[0].label).toBe('Upload OTP');
        expect(wrapper.vm.steps[1].label).toBe('Validate Nodes');
        expect(wrapper.vm.steps[2].label).toBe('Validate Flows');
        expect(wrapper.vm.steps[3].label).toBe('Select Layout');
        expect(wrapper.vm.steps[4].label).toBe('Preview & Import');
    });

    it('should initialize with empty data', () => {
        const wrapper = shallowMount(T2TImportWizard, {
            stubs: {
                'b-modal': true,
                't2t-upload': true,
                't2t-node-table': true,
                't2t-flow-table': true,
                't2t-layout-selector': true,
                't2t-preview': true
            }
        });

        expect(wrapper.vm.extractedNodes).toEqual([]);
        expect(wrapper.vm.extractedFlows).toEqual([]);
        expect(wrapper.vm.validatedNodes).toEqual([]);
        expect(wrapper.vm.validatedFlows).toEqual([]);
        expect(wrapper.vm.generatedThreatModel).toBe(null);
    });
});

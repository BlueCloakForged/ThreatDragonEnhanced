/**
 * Deterministic CWE/CAPEC Suggestion Engine
 * 
 * Provides rules-based suggestions for CWE weaknesses and CAPEC attack patterns
 * based on node type, services, ports, and role keywords.
 */

import suggestionRules from './suggestionRules.json';
import kbService from './kbService.js';

class SuggestionEngine {
    constructor() {
        this.rules = suggestionRules.rules;
        this.limits = suggestionRules.limits;
    }

    /**
     * Get suggestions for a node/element
     * @param {Object} nodeData - Node data with type, name, services, etc.
     * @param {Object} context - Additional context (connections, is_entrypoint, etc.)
     * @returns {Object} - { capec: [], cwe: [] } with suggested references
     */
    getSuggestions(nodeData, context = {}) {
        const matchedRules = this.matchRules(nodeData, context);
        
        // Collect all suggestions from matched rules
        const capecQueries = new Set();
        const cweIds = new Set();
        
        for (const rule of matchedRules) {
            (rule.suggest_capec_queries || []).forEach(q => capecQueries.add(q));
            (rule.suggest_cwe_ids || []).forEach(id => cweIds.add(id));
        }
        
        // Resolve CAPEC queries to actual entries
        const capecSuggestions = this.resolveCAPECQueries([...capecQueries]);
        
        // Resolve CWE IDs to entries
        const cweSuggestions = this.resolveCWEIds([...cweIds]);
        
        // Apply limits
        return {
            capec: capecSuggestions.slice(0, this.limits.max_capec_suggestions),
            cwe: cweSuggestions.slice(0, this.limits.max_cwe_suggestions),
            matchedRules: matchedRules.map(r => r.id)
        };
    }

    /**
     * Match rules against node data and context
     * @param {Object} nodeData 
     * @param {Object} context 
     * @returns {Array} - Matched rules
     */
    matchRules(nodeData, context) {
        const matched = [];
        const nodeName = (nodeData.name || '').toLowerCase();
        const nodeType = (nodeData.type || '').replace('tm.', '').replace('td.', '').toLowerCase();
        const services = this.extractServices(nodeData);
        const isEntrypoint = context.is_entrypoint || false;
        
        for (const rule of this.rules) {
            if (this.ruleMatches(rule, { nodeName, nodeType, services, isEntrypoint })) {
                matched.push(rule);
            }
        }
        
        return matched;
    }

    /**
     * Check if a single rule matches
     */
    ruleMatches(rule, { nodeName, nodeType, services, isEntrypoint }) {
        const triggers = rule.triggers || {};
        let matches = false;
        
        // Check node_type trigger
        if (triggers.node_type) {
            if (nodeType !== triggers.node_type.toLowerCase()) {
                return false;
            }
            matches = true;
        }
        
        // Check is_entrypoint trigger
        if (triggers.is_entrypoint === true && !isEntrypoint) {
            return false;
        }
        
        // Check services trigger (any match)
        if (triggers.services && triggers.services.length > 0) {
            const serviceMatch = triggers.services.some(s => 
                services.some(ns => ns.toLowerCase().includes(s.toLowerCase()))
            );
            if (serviceMatch) {
                matches = true;
            } else if (!triggers.role_keywords) {
                // If no role keywords, services must match
                return false;
            }
        }
        
        // Check role_keywords trigger (any match)
        if (triggers.role_keywords && triggers.role_keywords.length > 0) {
            const keywordMatch = triggers.role_keywords.some(kw => 
                nodeName.includes(kw.toLowerCase())
            );
            if (keywordMatch) {
                matches = true;
            }
        }
        
        return matches;
    }

    /**
     * Extract services from node data
     */
    extractServices(nodeData) {
        const services = [];
        
        // Check for services array
        if (nodeData.services && Array.isArray(nodeData.services)) {
            nodeData.services.forEach(s => {
                if (typeof s === 'string') {
                    services.push(s);
                } else if (s.protocol && s.port) {
                    services.push(`${s.protocol}:${s.port}`);
                }
            });
        }
        
        // Check for protocol property
        if (nodeData.protocol) {
            services.push(nodeData.protocol);
        }
        
        return services;
    }

    /**
     * Resolve CAPEC queries to KB entries
     */
    resolveCAPECQueries(queries) {
        const results = [];
        
        for (const query of queries) {
            const matches = kbService.searchCAPEC(query, 1);
            if (matches.length > 0) {
                results.push({
                    id: matches[0].id,
                    name: matches[0].name,
                    confidence: 'suggested'
                });
            }
        }
        
        return results;
    }

    /**
     * Resolve CWE IDs to KB entries
     */
    resolveCWEIds(ids) {
        const results = [];
        
        for (const id of ids) {
            const entry = kbService.getCWEById(id);
            if (entry) {
                results.push({
                    id: entry.id,
                    name: entry.name,
                    confidence: 'suggested'
                });
            }
        }
        
        return results;
    }
}

export default new SuggestionEngine();


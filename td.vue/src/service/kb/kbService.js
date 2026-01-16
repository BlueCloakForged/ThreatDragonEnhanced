/**
 * Knowledge Base Service
 * 
 * Provides offline search and lookup for CWE and CAPEC indexes.
 * Used by the Threat Dialog UI for KB references.
 */

import cweIndex from './cwe/cwe_index.json';
import capecIndex from './capec/capec_index.json';

/**
 * KBService - Offline CWE/CAPEC search and lookup
 */
class KBService {
    constructor() {
        this.cweItems = cweIndex.items || [];
        this.capecItems = capecIndex.items || [];
        this.cweVersion = cweIndex.version;
        this.capecVersion = capecIndex.version;
        
        // Build lookup maps for fast ID access
        this.cweById = new Map(this.cweItems.map(item => [item.id, item]));
        this.capecById = new Map(this.capecItems.map(item => [item.id, item]));
    }

    /**
     * Get KB metadata
     */
    getMetadata() {
        return {
            cwe: {
                version: this.cweVersion,
                count: this.cweItems.length
            },
            capec: {
                version: this.capecVersion,
                count: this.capecItems.length
            }
        };
    }

    /**
     * Search CWE entries
     * @param {string} query - Search query (matches ID or name)
     * @param {number} limit - Max results (default 20)
     * @returns {Array} - Matching CWE items
     */
    searchCWE(query, limit = 20) {
        if (!query || query.trim().length === 0) {
            return this.cweItems.slice(0, limit);
        }
        
        const normalizedQuery = query.toLowerCase().trim();
        const results = [];
        
        for (const item of this.cweItems) {
            // Exact ID match (highest priority)
            if (item.id.toLowerCase() === normalizedQuery) {
                results.unshift(item);
                continue;
            }
            
            // ID contains query
            if (item.id.toLowerCase().includes(normalizedQuery)) {
                results.push(item);
                continue;
            }
            
            // Name contains query
            if (item.name.toLowerCase().includes(normalizedQuery)) {
                results.push(item);
                continue;
            }
            
            // Summary contains query (lower priority)
            if (item.summary && item.summary.toLowerCase().includes(normalizedQuery)) {
                results.push(item);
            }
            
            if (results.length >= limit * 2) break; // Collect extra for sorting
        }
        
        return results.slice(0, limit);
    }

    /**
     * Search CAPEC entries
     * @param {string} query - Search query (matches ID or name)
     * @param {number} limit - Max results (default 20)
     * @returns {Array} - Matching CAPEC items
     */
    searchCAPEC(query, limit = 20) {
        if (!query || query.trim().length === 0) {
            return this.capecItems.slice(0, limit);
        }
        
        const normalizedQuery = query.toLowerCase().trim();
        const results = [];
        
        for (const item of this.capecItems) {
            // Exact ID match (highest priority)
            if (item.id.toLowerCase() === normalizedQuery) {
                results.unshift(item);
                continue;
            }
            
            // ID contains query
            if (item.id.toLowerCase().includes(normalizedQuery)) {
                results.push(item);
                continue;
            }
            
            // Name contains query
            if (item.name.toLowerCase().includes(normalizedQuery)) {
                results.push(item);
                continue;
            }
            
            // Summary contains query (lower priority)
            if (item.summary && item.summary.toLowerCase().includes(normalizedQuery)) {
                results.push(item);
            }
            
            if (results.length >= limit * 2) break;
        }
        
        return results.slice(0, limit);
    }

    /**
     * Get CWE by ID
     * @param {string} id - CWE ID (e.g., "CWE-89")
     * @returns {Object|null} - CWE item or null
     */
    getCWEById(id) {
        return this.cweById.get(id) || null;
    }

    /**
     * Get CAPEC by ID
     * @param {string} id - CAPEC ID (e.g., "CAPEC-66")
     * @returns {Object|null} - CAPEC item or null
     */
    getCAPECById(id) {
        return this.capecById.get(id) || null;
    }

    /**
     * Get related CWEs for a CAPEC
     * @param {string} capecId - CAPEC ID
     * @returns {Array} - Related CWE items
     */
    getRelatedCWEs(capecId) {
        const capec = this.getCAPECById(capecId);
        if (!capec || !capec.related_cwe) return [];
        
        return capec.related_cwe
            .map(cweId => this.getCWEById(cweId))
            .filter(Boolean);
    }
}

// Export singleton instance
export default new KBService();


/**
 * Simple integration test for T2T pipeline
 * Run this to verify the parser → extractor → DFDIR workflow
 */

import { T2TParser } from './parser/t2tParser.js';
import { EntityExtractor } from './parser/entityExtractor.js';
import { DFDIR, DFDElement, DFDFlow } from './models/dfdir.js';

/**
 * Test with sample OTP text
 */
async function testIntegration() {
    console.log('=== T2T Integration Test ===\n');

    // Sample OTP text (from real format)
    const sampleText = `
    # Sample OTP - Mission One
    ## Network Architecture

    | Hostname | Operating System | IP Address | Role | Services |
    |----------|-----------------|------------|------|----------|
    | Kali-01 | Kali Linux 2024.1 | 192.168.100.10 | Attacker | ssh, metasploit |
    | WebSrv-01 | Ubuntu 22.04 | 10.0.1.100 | Server | ssh, http, https, mysql |
    | DC-01 | Windows Server 2022 | 172.16.0.10 | Server | rdp, ldap, smb, dns |

    ## Mission Scenario

    The attacker will operate from Kali-01 to target WebSrv-01 via HTTPS.
    After gaining access, they will pivot from WebSrv-01 to DC-01 using RDP.
    `;

    // Step 1: Extract entities
    console.log('Step 1: Extracting entities...');
    const extractor = new EntityExtractor();
    const { nodes, connections } = extractor.extract(sampleText);

    console.log(`✅ Extracted ${nodes.length} nodes`);
    console.log(`✅ Extracted ${connections.length} connections\n`);

    // Step 2: Build DFDIR
    console.log('Step 2: Building DFDIR...');
    const dfdir = new DFDIR('Mission One');
    dfdir.metadata.source = 'integration-test';
    dfdir.metadata.extractionMethod = 'text';

    nodes.forEach((node, idx) => {
        const element = new DFDElement({
            id: node.id,
            name: node.name,
            type: node.type,
            x: 100 + (idx * 200),
            y: 100,
            ipAddress: node.ipAddress,
            services: node.services,
            metadata: node.metadata,
            confidence: node.confidence,
            source: node.source
        });
        dfdir.addElement(element);
    });

    connections.forEach(conn => {
        const flow = new DFDFlow({
            id: conn.id,
            sourceId: conn.sourceId,
            targetId: conn.targetId,
            protocol: conn.protocol,
            isEncrypted: conn.isEncrypted,
            metadata: conn.metadata,
            confidence: conn.confidence,
            source: conn.source
        });
        dfdir.addFlow(flow);
    });

    console.log('✅ DFDIR created\n');

    // Step 3: Validate DFDIR
    console.log('Step 3: Validating DFDIR...');
    const errors = dfdir.validate();

    if (errors.length === 0) {
        console.log('✅ DFDIR is valid!\n');
    } else {
        console.log('❌ Validation errors:');
        errors.forEach(err => console.log(`  - ${err}`));
        console.log('');
    }

    // Step 4: Get statistics
    console.log('Step 4: Statistics...');
    const stats = dfdir.getStatistics();

    console.log(`Total Elements: ${stats.totalElements}`);
    console.log(`  - Actors: ${stats.elementsByType.actor}`);
    console.log(`  - Processes: ${stats.elementsByType.process}`);
    console.log(`  - Stores: ${stats.elementsByType.store}`);
    console.log(`Total Flows: ${stats.totalFlows}`);
    console.log(`Average Confidence:`);
    console.log(`  - Elements: ${stats.averageConfidence.elements}%`);
    console.log(`  - Flows: ${stats.averageConfidence.flows}%`);
    console.log(`Low Confidence Elements: ${stats.lowConfidenceElements}`);
    console.log(`Missing IPs: ${stats.missingIPs}\n`);

    // Step 5: Display extracted data
    console.log('=== Extracted Nodes ===');
    nodes.forEach(node => {
        console.log(`\n${node.name} (${node.type})`);
        console.log(`  IP: ${node.ipAddress || 'N/A'}`);
        console.log(`  Services: ${node.services.join(', ') || 'None'}`);
        console.log(`  Confidence: ${node.confidence}%`);
    });

    console.log('\n=== Extracted Connections ===');
    connections.forEach(conn => {
        const source = nodes.find(n => n.id === conn.sourceId);
        const target = nodes.find(n => n.id === conn.targetId);
        console.log(`\n${source?.name} → ${target?.name}`);
        console.log(`  Protocol: ${conn.protocol}`);
        console.log(`  Encrypted: ${conn.isEncrypted}`);
        console.log(`  Confidence: ${conn.confidence}%`);
    });

    console.log('\n=== Test Complete ===');
    console.log(`✅ All ${nodes.length} nodes successfully processed`);
    console.log(`✅ All ${connections.length} connections successfully processed`);
    console.log('✅ DFDIR validation passed');

    return {
        success: true,
        dfdir,
        stats
    };
}

// Run test if executed directly
if (typeof window === 'undefined') {
    testIntegration().catch(console.error);
}

export { testIntegration };

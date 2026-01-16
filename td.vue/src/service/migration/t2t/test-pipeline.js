/**
 * Complete T2T Pipeline Integration Test
 * Tests the full flow: OTP Text → DFDIR → Threat Dragon JSON
 *
 * Pipeline:
 * 1. Parse OTP document (PDF/DOCX/TXT)
 * 2. Extract entities (nodes and connections)
 * 3. Apply layout algorithm
 * 4. Build DFDIR structure
 * 5. Convert to Threat Dragon JSON
 * 6. Validate output
 */

import { EntityExtractor } from './parser/entityExtractor.js';
import { T2TLayout } from './layout/t2tLayout.js';
import { DFDIR, DFDElement, DFDFlow } from './models/dfdir.js';
import { T2TConverter } from './converter/t2tConverter.js';

/**
 * Complete pipeline test using real OTP sample
 */
async function testCompletePipeline() {
    console.log('='.repeat(80));
    console.log('T2T COMPLETE PIPELINE TEST');
    console.log('='.repeat(80));

    // Sample OTP text (from sample_mission.txt)
    const otpText = `
# Sample OTP - Mission One
## Operational Test Plan v1.0

### Mission Overview
Mission One focuses on testing offensive cyber operations against a simulated
corporate network environment. The red team will utilize Kali Linux workstations
to conduct reconnaissance and exploitation against target systems.

### Network Architecture
The test environment consists of three primary enclaves:
- Red Team Enclave (attack infrastructure)
- DMZ (exposed services)
- Internal Corporate Network (target systems)

All network traffic between enclaves passes through VyOS routers configured
with appropriate firewall rules and OSPF routing.

## Table 1: Hardware Specifications

| Hostname | Operating System | Architecture | IP Address | Role | Services |
|----------|-----------------|--------------|------------|------|----------|
| Kali-01 | Kali Linux 2024.1 | x64 | 192.168.100.10 | Attacker | ssh, metasploit |
| Kali-02 | Kali Linux 2024.1 | x64 | 192.168.100.11 | Attacker | ssh, burpsuite |
| Router-01 | VyOS 1.4 | x64 | 192.168.100.1 | Router | ssh, ospf |
| Router-02 | VyOS 1.4 | x64 | 10.0.0.1 | Router | ssh, ospf |
| FW-01 | pfSense 2.7 | x64 | 10.0.0.254 | Firewall | ssh, https |
| WebSrv-01 | Ubuntu 22.04 | x64 | 10.0.1.100 | Server | ssh, http, https, mysql |
| DC-01 | Windows Server 2022 | x64 | 172.16.0.10 | Server | rdp, ldap, smb, dns |
| WS-01 | Windows 10 | x64 | 172.16.0.100 | Workstation | rdp |
| WS-02 | Windows 10 | x64 | 172.16.0.101 | Workstation | rdp |

## Mission Scenario Text

The scenario begins with the Red Team operating from the Kali-01 and Kali-02
systems in the Red Team Enclave. Initial reconnaissance will target the
DMZ segment where WebSrv-01 hosts a vulnerable web application running on
Apache with MySQL backend.

The attacker will exploit CVE-2024-XXXX to gain remote code execution on the
Ubuntu web server. From there, they will pivot through Router-02 to access
the Internal Corporate Network.

The ultimate target is DC-01, the Windows Server 2022 domain controller running
Active Directory. The Blue Team defenders will be monitoring from their Security
Operations Center using standard SIEM tools.

WS-01 and WS-02 represent typical employee Windows 10 workstations that may
be used as intermediate pivot points. These systems have RDP enabled and are
domain-joined.
`;

    try {
        // STEP 1: Extract Entities
        console.log('\n[STEP 1] Extracting entities from OTP text...');
        const extractor = new EntityExtractor();
        const { nodes, connections } = extractor.extract(otpText);

        console.log(`✓ Extracted ${nodes.length} nodes`);
        console.log(`✓ Extracted ${connections.length} connections`);

        // Display extracted nodes
        console.log('\nExtracted Nodes:');
        nodes.forEach(node => {
            console.log(`  - ${node.name} (${node.type}) [${node.ipAddress || 'no IP'}] - Confidence: ${node.confidence}%`);
        });

        // Display extracted connections
        console.log('\nExtracted Connections:');
        connections.forEach(conn => {
            const sourceNode = nodes.find(n => n.id === conn.sourceId);
            const targetNode = nodes.find(n => n.id === conn.targetId);
            console.log(`  - ${sourceNode?.name} → ${targetNode?.name} (${conn.protocol}) - Confidence: ${conn.confidence}%`);
        });

        // STEP 2: Apply Layout Algorithm
        console.log('\n[STEP 2] Applying layout algorithm...');
        const layout = new T2TLayout();
        const positionedNodes = layout.calculateLayout(nodes, connections, 'tiered');

        console.log('✓ Layout applied (tiered)');
        console.log('\nNode Positions:');
        positionedNodes.slice(0, 5).forEach(node => {
            console.log(`  - ${node.name}: (${node.x}, ${node.y})`);
        });

        // STEP 3: Build DFDIR
        console.log('\n[STEP 3] Building DFDIR structure...');
        const dfdir = new DFDIR('Sample OTP - Mission One');
        dfdir.metadata.source = 'sample_mission.txt';
        dfdir.metadata.extractionMethod = 't2t-text-extraction';

        // Add elements
        positionedNodes.forEach(nodeData => {
            const element = new DFDElement(nodeData);
            dfdir.addElement(element);
        });

        // Add flows
        connections.forEach(connData => {
            const flow = new DFDFlow(connData);
            dfdir.addFlow(flow);
        });

        console.log('✓ DFDIR created');

        // Validate DFDIR
        const validationErrors = dfdir.validate();
        if (validationErrors.length > 0) {
            console.log('⚠ DFDIR Validation Warnings:');
            validationErrors.forEach(error => console.log(`  - ${error}`));
        } else {
            console.log('✓ DFDIR validation passed');
        }

        // Get statistics
        const stats = dfdir.getStatistics();
        console.log('\nDFDIR Statistics:');
        console.log(`  - Total Elements: ${stats.totalElements}`);
        console.log(`  - Actors: ${stats.elementsByType.actor}`);
        console.log(`  - Processes: ${stats.elementsByType.process}`);
        console.log(`  - Stores: ${stats.elementsByType.store}`);
        console.log(`  - Total Flows: ${stats.totalFlows}`);
        console.log(`  - Average Element Confidence: ${stats.averageConfidence.elements}%`);
        console.log(`  - Average Flow Confidence: ${stats.averageConfidence.flows}%`);
        console.log(`  - Low Confidence Elements: ${stats.lowConfidenceElements}`);
        console.log(`  - Missing IPs: ${stats.missingIPs}`);

        // STEP 4: Convert to Threat Dragon JSON
        console.log('\n[STEP 4] Converting to Threat Dragon JSON...');
        const converter = new T2TConverter();
        const { threatModel, validation } = converter.convertAndValidate(dfdir, {
            diagramName: 'Mission One Network Topology',
            diagramDescription: 'Auto-generated from Sample OTP - Mission One',
            projectName: 'Cyber Range - Mission One',
            projectOwner: 'Red Team',
            includeMetadata: true
        });

        console.log('✓ Conversion complete');

        // Validate converted model
        if (validation.valid) {
            console.log('✓ Threat Dragon JSON validation passed');
        } else {
            console.log('⚠ Threat Dragon JSON Validation Errors:');
            validation.errors.forEach(error => console.log(`  - ${error}`));
        }

        // Display Threat Dragon structure
        console.log('\nThreat Dragon Model Structure:');
        console.log(`  - Version: ${threatModel.version}`);
        console.log(`  - Project: ${threatModel.summary.title}`);
        console.log(`  - Owner: ${threatModel.summary.owner}`);
        console.log(`  - Diagrams: ${threatModel.detail.diagrams.length}`);

        const diagram = threatModel.detail.diagrams[0];
        console.log(`  - Diagram: "${diagram.title}"`);
        console.log(`  - Cells: ${diagram.cells.length}`);

        // Count cell types
        const cellTypes = {};
        diagram.cells.forEach(cell => {
            cellTypes[cell.shape] = (cellTypes[cell.shape] || 0) + 1;
        });
        console.log('  - Cell Types:');
        Object.entries(cellTypes).forEach(([type, count]) => {
            console.log(`    - ${type}: ${count}`);
        });

        // STEP 5: Export JSON
        console.log('\n[STEP 5] Exporting JSON...');
        const jsonOutput = converter.exportJSON(threatModel, true);
        console.log(`✓ JSON exported (${jsonOutput.length} characters)`);

        // Display sample of JSON (first 500 chars)
        console.log('\nSample JSON Output (first 500 chars):');
        console.log(jsonOutput.substring(0, 500) + '...');

        // STEP 6: Quality Metrics
        console.log('\n[STEP 6] Quality Metrics...');
        const metrics = calculateQualityMetrics(nodes, connections, stats);
        console.log('Quality Assessment:');
        console.log(`  - Extraction Success Rate: ${metrics.extractionRate}%`);
        console.log(`  - Average Confidence: ${metrics.avgConfidence}%`);
        console.log(`  - Complete Nodes (with IP): ${metrics.completeNodesPercent}%`);
        console.log(`  - Grid Compliance: ${metrics.gridCompliant ? '✓ PASS' : '✗ FAIL'}`);
        console.log(`  - Overall Grade: ${metrics.grade}`);

        // FINAL RESULT
        console.log('\n' + '='.repeat(80));
        console.log('PIPELINE TEST COMPLETE');
        console.log('='.repeat(80));
        console.log(`✓ Successfully processed ${nodes.length} nodes and ${connections.length} connections`);
        console.log(`✓ Generated Threat Dragon model with ${diagram.cells.length} cells`);
        console.log(`✓ Overall Quality: ${metrics.grade} (${metrics.avgConfidence}% confidence)`);
        console.log('='.repeat(80));

        return {
            success: true,
            nodes,
            connections,
            dfdir,
            threatModel,
            validation,
            metrics
        };

    } catch (error) {
        console.error('\n✗ Pipeline test failed:', error.message);
        console.error(error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Calculate quality metrics for extraction
 */
function calculateQualityMetrics(nodes, connections, stats) {
    const totalExpected = 9; // We know the sample has 9 nodes
    const extractionRate = Math.round((nodes.length / totalExpected) * 100);

    const avgConfidence = stats.averageConfidence.elements;

    const nodesWithIP = nodes.filter(n => n.ipAddress).length;
    const completeNodesPercent = Math.round((nodesWithIP / nodes.length) * 100);

    // Check grid compliance (all coordinates should be multiples of 100)
    const gridCompliant = nodes.every(n => n.x % 100 === 0 && n.y % 100 === 0);

    // Calculate grade
    let grade;
    if (avgConfidence >= 90 && extractionRate >= 90) {
        grade = 'A (Excellent)';
    } else if (avgConfidence >= 80 && extractionRate >= 80) {
        grade = 'B (Good)';
    } else if (avgConfidence >= 70 && extractionRate >= 70) {
        grade = 'C (Fair)';
    } else {
        grade = 'D (Needs Improvement)';
    }

    return {
        extractionRate,
        avgConfidence,
        completeNodesPercent,
        gridCompliant,
        grade
    };
}

/**
 * Test individual components
 */
async function testComponents() {
    console.log('\n' + '='.repeat(80));
    console.log('COMPONENT UNIT TESTS');
    console.log('='.repeat(80));

    // Test 1: DFDIR Model
    console.log('\n[TEST 1] DFDIR Model...');
    try {
        const dfdir = new DFDIR('Test Model');
        const element = new DFDElement({
            id: 'test-1',
            name: 'Test Server',
            type: 'process',
            x: 100,
            y: 200,
            ipAddress: '192.168.1.1',
            services: ['http', 'ssh'],
            confidence: 95
        });
        dfdir.addElement(element);
        console.log('✓ DFDIR model working');
    } catch (error) {
        console.log('✗ DFDIR model failed:', error.message);
    }

    // Test 2: Layout Engine
    console.log('\n[TEST 2] Layout Engine...');
    try {
        const layout = new T2TLayout();
        const testNodes = [
            { id: '1', name: 'Actor1', type: 'actor', x: 0, y: 0 },
            { id: '2', name: 'Process1', type: 'process', x: 0, y: 0 },
            { id: '3', name: 'Store1', type: 'store', x: 0, y: 0 }
        ];
        const positioned = layout.calculateLayout(testNodes, [], 'tiered');
        const allSnapped = positioned.every(n => n.x % 100 === 0 && n.y % 100 === 0);
        console.log(`✓ Layout engine working (grid snap: ${allSnapped ? 'PASS' : 'FAIL'})`);
    } catch (error) {
        console.log('✗ Layout engine failed:', error.message);
    }

    // Test 3: Converter
    console.log('\n[TEST 3] Converter...');
    try {
        const dfdir = new DFDIR('Test');
        const elem1 = new DFDElement({
            id: 'e1',
            name: 'Test',
            type: 'process',
            x: 100,
            y: 100
        });
        dfdir.addElement(elem1);

        const converter = new T2TConverter();
        const { validation } = converter.convertAndValidate(dfdir);
        console.log(`✓ Converter working (valid: ${validation.valid})`);
    } catch (error) {
        console.log('✗ Converter failed:', error.message);
    }

    console.log('\n' + '='.repeat(80));
}

// Run tests
async function runAllTests() {
    await testComponents();
    await testCompletePipeline();
}

// Export for use in other modules
export {
    testCompletePipeline,
    testComponents,
    runAllTests,
    calculateQualityMetrics
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

# T2T (Test-Plan-to-Topology) Integration

## Overview

The T2T module enables automatic extraction of threat model diagrams from Operational Test Plan (OTP) documents. It converts structured text descriptions of network topologies into Threat Dragon threat models.

## Pipeline Architecture

```
OTP Document (PDF/DOCX/TXT)
    ↓
[Parser] → Extract raw text
    ↓
[Entity Extractor] → Identify nodes and connections
    ↓
[Layout Engine] → Calculate positions (tiered/radial/hierarchical)
    ↓
[DFDIR Builder] → Build intermediate representation
    ↓
[Converter] → Generate Threat Dragon JSON
    ↓
Threat Dragon Model (ready to import)
```

## Module Structure

```
td.vue/src/service/migration/t2t/
├── models/
│   └── dfdir.js                    # DFDIR data models (DFDElement, DFDFlow, DFDIR)
├── parser/
│   ├── t2tParser.js                # Document parser (PDF, DOCX, TXT, MD)
│   ├── t2tPatterns.js              # Regex patterns for entity extraction
│   └── entityExtractor.js          # Entity extraction logic
├── layout/
│   └── t2tLayout.js                # Layout algorithms (tiered, radial, hierarchical)
├── converter/
│   └── t2tConverter.js             # DFDIR → Threat Dragon JSON converter
├── test-integration.js             # Simple integration test
├── test-pipeline.js                # Complete pipeline test script
└── README.md                       # This file
```

## Key Features

### 1. Multi-Format Document Parsing
- **Supported formats**: PDF, DOCX, TXT, MD
- **Libraries**: pdfjs-dist (PDF), mammoth (DOCX)
- **File size limit**: 10MB
- **Validation**: File type and size checks

### 2. Entity Extraction
- **Pattern-based extraction** using multiple regex patterns:
  - Markdown table rows: `| Hostname | OS | IP | Role | Services |`
  - Inline format: `NodeName (192.168.1.1)`
  - System names: Generic fallback patterns
- **Connection detection**:
  - Arrow notation: `A → B`
  - Textual: "from A to B", "pivot through X"
- **Confidence scoring**: 0-100% based on data completeness
- **Protocol inference**: Detects HTTPS, SSH, RDP, MySQL, etc.
- **Node classification**: Actor, Process, or Store

### 3. Layout Algorithms
- **Tiered Layout** (default): Actors (top) → Processes (middle) → Stores (bottom)
- **Radial Layout**: Circular arrangement for equal-level relationships
- **Hierarchical Layout**: Tree structure based on connection dependencies (BFS)
- **Grid Snap Compliance**: All coordinates in multiples of 100 (CRO requirement)
- **Overlap Prevention**: Automatic spacing adjustments

### 4. DFDIR (DFD Intermediate Representation)
- **Format-agnostic** data structure
- **Validation**: Structural integrity checks
- **Statistics**: Confidence metrics, extraction sources, completeness
- **Serialization**: JSON import/export

### 5. Threat Dragon Conversion
- **Cell types**: tm.Actor, tm.Process, tm.Store, tm.Flow
- **Metadata preservation**: IP addresses, services, confidence scores
- **Visual indicators**: Color-coded by confidence (high=black, medium=amber, low=red)
- **Validation**: Structural checks for Threat Dragon v2.5.0 format

## Usage Examples

### Example 1: Simple Extraction

```javascript
import { EntityExtractor } from './parser/entityExtractor.js';
import { DFDIR, DFDElement, DFDFlow } from './models/dfdir.js';

const otpText = `
| Hostname | IP Address | Role | Services |
|----------|------------|------|----------|
| Web-01 | 10.0.1.100 | Server | http, https |
| DB-01 | 10.0.1.200 | Server | mysql |
`;

// Extract entities
const extractor = new EntityExtractor();
const { nodes, connections } = extractor.extract(otpText);

// Build DFDIR
const dfdir = new DFDIR('My Network');
nodes.forEach(node => dfdir.addElement(new DFDElement(node)));
connections.forEach(conn => dfdir.addFlow(new DFDFlow(conn)));

// Validate
const validation = dfdir.validate();
console.log(`Valid: ${validation.valid}`);
```

### Example 2: Complete Pipeline

```javascript
import { EntityExtractor } from './parser/entityExtractor.js';
import { T2TLayout } from './layout/t2tLayout.js';
import { DFDIR, DFDElement, DFDFlow } from './models/dfdir.js';
import { T2TConverter } from './converter/t2tConverter.js';

// Step 1: Extract
const extractor = new EntityExtractor();
const { nodes, connections } = extractor.extract(otpText);

// Step 2: Apply Layout
const layout = new T2TLayout();
const positioned = layout.calculateLayout(nodes, connections, 'tiered');

// Step 3: Build DFDIR
const dfdir = new DFDIR('Mission One');
positioned.forEach(node => dfdir.addElement(new DFDElement(node)));
connections.forEach(conn => dfdir.addFlow(new DFDFlow(conn)));

// Step 4: Convert to Threat Dragon
const converter = new T2TConverter();
const { threatModel, validation } = converter.convertAndValidate(dfdir, {
    diagramName: 'Network Topology',
    projectName: 'Cyber Range',
    projectOwner: 'Red Team',
    includeMetadata: true
});

// Step 5: Export JSON
const jsonOutput = converter.exportJSON(threatModel);
console.log(jsonOutput);
```

### Example 3: Vision + Text Extraction

```javascript
// Extract from text
const extractor = new EntityExtractor();
const { nodes, connections } = extractor.extract(otpText);

// Merge with vision/OCR results
const visionResults = {
    nodes: [/* vision-extracted nodes */],
    connections: [/* vision-extracted connections */]
};

const { nodes: merged, connections: mergedConns } = extractor.extract(otpText, visionResults);
// Vision results are merged with text extraction, confidence scores averaged
```

## OTP Format Requirements

### Recommended Format (Highest Accuracy)

```markdown
# Operational Test Plan

## Hardware Specifications

| Hostname | Operating System | Architecture | IP Address | Role | Services |
|----------|-----------------|--------------|------------|------|----------|
| Kali-01 | Kali Linux 2024.1 | x64 | 192.168.100.10 | Attacker | ssh, metasploit |
| WebSrv-01 | Ubuntu 22.04 | x64 | 10.0.1.100 | Server | ssh, http, https, mysql |
| DC-01 | Windows Server 2022 | x64 | 172.16.0.10 | Server | rdp, ldap, smb, dns |

## Network Flows

The attacker will pivot from Kali-01 to WebSrv-01.
From WebSrv-01, the attacker connects to DC-01.
```

### Alternative Formats (Lower Accuracy)

- Inline: `Kali-01 (192.168.100.10) connects to WebSrv-01 (10.0.1.100)`
- Arrow notation: `Kali-01 → WebSrv-01 → DC-01`
- Generic names: "The Kali machine accesses the Windows server"

## Quality Metrics

### Extraction Success Criteria
- **Extraction Rate**: >90% (nodes found / nodes expected)
- **Average Confidence**: >90%
- **Complete Nodes**: >80% (nodes with IP addresses)
- **Grid Compliance**: 100% (all coordinates multiples of 100)

### Confidence Scoring

**Nodes:**
- Base confidence by extraction method:
  - Table row: 95%
  - Inline format: 85%
  - System name: 65%
- Adjustments:
  - +5% for valid IPv4 address
  - +5% for services detected
  - +5% for role information
  - -15% for missing IP address

**Connections:**
- Base confidence by pattern: 80%
- Adjusted based on node confidence (averaged)

## Testing

### Run Unit Tests

```bash
npm test -- tests/unit/t2t/pipeline.spec.js
```

### Run Integration Test

```bash
node src/service/migration/t2t/test-pipeline.js
```

### Test Coverage

**14 test cases** covering:
1. Entity extraction (nodes and connections)
2. Node type classification
3. Layout algorithms (tiered, radial, hierarchical)
4. Grid snap compliance
5. DFDIR construction and validation
6. Statistics calculation
7. Threat Dragon conversion
8. Cell generation
9. Metadata preservation
10. End-to-end pipeline
11. Quality metrics

All tests passing ✓

## Data Models

### DFDElement

```javascript
{
    id: 'uuid',
    name: 'WebSrv-01',
    type: 'process',          // 'actor' | 'process' | 'store'
    x: 100,                   // Grid-snapped coordinate
    y: 200,                   // Grid-snapped coordinate
    ipAddress: '10.0.1.100',
    services: ['http', 'ssh'],
    metadata: {
        role: 'Server',
        extractedFrom: 'table'
    },
    confidence: 95,           // 0-100
    source: 'text'            // 'text' | 'vision' | 'manual'
}
```

### DFDFlow

```javascript
{
    id: 'uuid',
    sourceId: 'element-uuid-1',
    targetId: 'element-uuid-2',
    protocol: 'HTTPS',
    isEncrypted: true,
    isPublicNetwork: false,
    metadata: {
        sourceNode: 'Kali-01',
        targetNode: 'WebSrv-01'
    },
    confidence: 80,
    source: 'text'
}
```

### Threat Dragon Cell (Actor)

```javascript
{
    position: { x: 100, y: 200 },
    size: { width: 160, height: 80 },
    shape: 'tm.Actor',
    id: 'uuid',
    data: {
        type: 'tm.Actor',
        name: 'Kali-01',
        description: 'IP: 192.168.100.10 | Services: ssh, metasploit',
        threats: [],
        metadata: {
            ipAddress: '192.168.100.10',
            services: ['ssh', 'metasploit'],
            confidence: 95
        }
    }
}
```

## Implementation Status

### ✅ Completed (Phase 1)

- [x] DFDIR data models with validation
- [x] PDF/DOCX/TXT/MD parser
- [x] Regex pattern library (based on real OTP format)
- [x] Entity extractor with multiple patterns
- [x] Confidence scoring algorithm
- [x] Layout engine (3 algorithms)
- [x] Grid snap compliance
- [x] Overlap prevention
- [x] DFDIR → Threat Dragon JSON converter
- [x] Metadata preservation
- [x] Complete test suite (14 tests, all passing)

### 🔄 Next Phase (Wizard UI)

- [ ] Upload component (file selection + validation)
- [ ] Node validation table (editable grid)
- [ ] Flow validation table (editable grid)
- [ ] Layout selector (preview for each type)
- [ ] Final preview (Threat Dragon diagram render)
- [ ] Import button (save to Threat Dragon)

### 🔄 Future Enhancements

- [ ] Vision/OCR service (Tesseract.js integration)
- [ ] Template registry (system classification)
- [ ] Enclave detection (DMZ, Internal, External)
- [ ] Trust boundary generation
- [ ] Threat suggestion based on STRIDE
- [ ] Multi-document support (merge multiple OTPs)

## Dependencies

### Frontend (td.vue)
- `pdfjs-dist@^5.4.530` - PDF parsing
- `mammoth@^1.11.0` - DOCX parsing
- `uuid@^11.1.0` - UUID generation

### Backend (td.server) - Future
- `pdf-parse` - Alternative PDF parser
- `multer` - File upload handling
- `tesseract.js` - OCR for diagram images
- `jimp` - Image processing

## Performance

### Benchmarks (Sample OTP - 9 nodes)
- **Parsing**: <100ms (text), ~500ms (PDF), ~300ms (DOCX)
- **Extraction**: ~50ms
- **Layout**: ~10ms
- **Conversion**: ~5ms
- **Total Pipeline**: <200ms (text), <700ms (PDF)

### Scalability
- Tested with up to 50 nodes, 100 connections
- Linear complexity O(n) for most operations
- Layout overlap detection: O(n²) but limited to 100 iterations

## Error Handling

### Validation Errors
```javascript
const validation = dfdir.validate();
if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    // Example errors:
    // - "Element 0 (Web-01): Element missing IP"
    // - "Flow 2: Source element abc-123 not found"
}
```

### Conversion Errors
```javascript
try {
    const threatModel = converter.convert(dfdir);
} catch (error) {
    console.error('Conversion failed:', error.message);
    // Example: "DFDIR validation failed: ..."
}
```

## Configuration

### Layout Configuration

```javascript
const layout = new T2TLayout(100); // Grid snap (default: 100)
layout.canvasWidth = 2000;         // Canvas dimensions
layout.canvasHeight = 1500;

// Customize spacing
const nodes = layout.calculateTieredLayout(myNodes);
```

### Converter Configuration

```javascript
const options = {
    diagramName: 'My Diagram',
    diagramDescription: 'Auto-generated topology',
    projectName: 'My Project',
    projectOwner: 'Security Team',
    includeMetadata: true  // Include extraction metadata
};

const threatModel = converter.convert(dfdir, options);
```

## Troubleshooting

### Low Extraction Accuracy

**Problem**: Not finding all nodes in the OTP

**Solutions**:
1. Ensure markdown tables are properly formatted
2. Use explicit IP addresses with hostnames
3. Add connection descriptions ("X connects to Y")
4. Check for typos in system names

### Grid Snap Issues

**Problem**: Coordinates not multiples of 100

**Solution**: Always use the layout engine - it enforces grid snap automatically

```javascript
// ✓ Correct
const positioned = layout.calculateLayout(nodes, [], 'tiered');

// ✗ Incorrect - manually setting positions
node.x = 123; // Not grid-snapped!
```

### Validation Failures

**Problem**: DFDIR validation failing

**Common causes**:
- Missing required fields (id, name, type)
- Invalid node types (must be 'actor', 'process', or 'store')
- Orphaned flows (source/target nodes don't exist)
- Confidence out of range (must be 0-100)

## Contributing

When adding new features to T2T:

1. **Add tests** in `tests/unit/t2t/pipeline.spec.js`
2. **Update patterns** in `parser/t2tPatterns.js` for new extraction formats
3. **Maintain grid snap** compliance in all layout changes
4. **Preserve metadata** through the pipeline for transparency
5. **Run full test suite** before committing

```bash
npm run lint        # Check code style
npm test           # Run all tests
npm run build      # Build production version
```

## License

Apache-2.0 (same as OWASP Threat Dragon)

## Support

For issues related to T2T integration:
- GitHub Issues: https://github.com/OWASP/threat-dragon/issues
- Tag with: `t2t`, `import`, `otp`

## Version History

### v1.0.0 (2026-01-16)
- Initial implementation
- Core pipeline: Parser → Extractor → Layout → DFDIR → Converter
- 3 layout algorithms
- 14 passing test cases
- Support for PDF, DOCX, TXT, MD formats
- Grid snap compliance
- Confidence scoring
- Metadata preservation

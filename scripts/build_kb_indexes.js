#!/usr/bin/env node
/**
 * KB Index Build Script
 * 
 * Downloads official MITRE CWE and CAPEC XML files and generates
 * compact JSON indexes for offline use in Threat Dragon Enhanced.
 * 
 * Usage: node scripts/build_kb_indexes.js
 * 
 * Outputs:
 *   - td.vue/src/service/kb/cwe/cwe_index.json
 *   - td.vue/src/service/kb/cwe/cwe_version.json
 *   - td.vue/src/service/kb/capec/capec_index.json
 *   - td.vue/src/service/kb/capec/capec_version.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const AdmZip = require('adm-zip');

// MITRE download URLs
const CWE_URL = 'https://cwe.mitre.org/data/xml/cwec_latest.xml.zip';
const CAPEC_URL = 'https://capec.mitre.org/data/xml/capec_latest.xml';

// Output paths
const KB_BASE = path.join(__dirname, '..', 'td.vue', 'src', 'service', 'kb');
const CWE_OUTPUT = path.join(KB_BASE, 'cwe');
const CAPEC_OUTPUT = path.join(KB_BASE, 'capec');

// Ensure directories exist
[CWE_OUTPUT, CAPEC_OUTPUT].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading: ${url}`);
        const file = fs.createWriteStream(dest);
        
        const request = (url) => {
            https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    request(response.headers.location);
                    return;
                }
                
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`  Downloaded: ${dest}`);
                    resolve(dest);
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => {}); // Delete partial file
                reject(err);
            });
        };
        
        request(url);
    });
}

/**
 * Parse CWE XML and extract index
 */
function parseCWEXml(xmlContent) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
    });
    
    const data = parser.parse(xmlContent);
    const catalog = data.Weakness_Catalog;
    const version = catalog['@_Version'] || 'unknown';
    const weaknesses = catalog.Weaknesses?.Weakness || [];
    
    const items = [];
    const weaknessArray = Array.isArray(weaknesses) ? weaknesses : [weaknesses];
    
    for (const w of weaknessArray) {
        const id = `CWE-${w['@_ID']}`;
        const name = w['@_Name'] || '';
        let summary = '';
        
        // Get description/summary
        if (w.Description) {
            summary = typeof w.Description === 'string' 
                ? w.Description 
                : (w.Description['#text'] || JSON.stringify(w.Description));
            // Truncate to 500 chars
            summary = summary.substring(0, 500).replace(/\s+/g, ' ').trim();
        }
        
        items.push({ id, name, summary });
    }
    
    return { version, items };
}

/**
 * Parse CAPEC XML and extract index
 */
function parseCAPECXml(xmlContent) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
    });
    
    const data = parser.parse(xmlContent);
    const catalog = data.Attack_Pattern_Catalog;
    const version = catalog['@_Version'] || 'unknown';
    const patterns = catalog.Attack_Patterns?.Attack_Pattern || [];
    
    const items = [];
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    
    for (const p of patternArray) {
        const id = `CAPEC-${p['@_ID']}`;
        const name = p['@_Name'] || '';
        let summary = '';
        
        // Get description/summary
        if (p.Description) {
            summary = typeof p.Description === 'string'
                ? p.Description
                : (p.Description['#text'] || extractTextFromHtml(p.Description));
            summary = summary.substring(0, 500).replace(/\s+/g, ' ').trim();
        }
        
        // Extract related CWEs
        const relatedCwe = [];
        const relatedWeaknesses = p.Related_Weaknesses?.Related_Weakness;
        if (relatedWeaknesses) {
            const rwArray = Array.isArray(relatedWeaknesses) ? relatedWeaknesses : [relatedWeaknesses];
            for (const rw of rwArray) {
                if (rw['@_CWE_ID']) {
                    relatedCwe.push(`CWE-${rw['@_CWE_ID']}`);
                }
            }
        }
        
        items.push({ id, name, summary, related_cwe: relatedCwe });
    }
    
    return { version, items };
}

/**
 * Extract text from XHTML content
 */
function extractTextFromHtml(obj) {
    if (typeof obj === 'string') return obj;
    if (obj['xhtml:p']) {
        const p = obj['xhtml:p'];
        if (typeof p === 'string') return p;
        if (Array.isArray(p)) return p.map(extractTextFromHtml).join(' ');
        return extractTextFromHtml(p);
    }
    if (obj['#text']) return obj['#text'];
    return '';
}

/**
 * Main build function
 */
async function buildKBIndexes() {
    console.log('='.repeat(60));
    console.log('Building CWE/CAPEC Knowledge Base Indexes');
    console.log('='.repeat(60));

    const tempDir = path.join(__dirname, 'temp_kb');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        // --- Build CWE Index ---
        console.log('\n[1/2] Building CWE Index...');
        const cweZipPath = path.join(tempDir, 'cwe_latest.xml.zip');
        await downloadFile(CWE_URL, cweZipPath);

        // Extract ZIP
        const zip = new AdmZip(cweZipPath);
        const zipEntries = zip.getEntries();
        const cweEntry = zipEntries.find(e => e.entryName.endsWith('.xml'));

        if (!cweEntry) {
            throw new Error('No XML file found in CWE ZIP');
        }

        const cweXmlContent = zip.readAsText(cweEntry);
        console.log(`  Parsing CWE XML (${(cweXmlContent.length / 1024 / 1024).toFixed(1)} MB)...`);

        const cweData = parseCWEXml(cweXmlContent);
        console.log(`  Found ${cweData.items.length} CWE entries`);

        // Write CWE index
        fs.writeFileSync(
            path.join(CWE_OUTPUT, 'cwe_index.json'),
            JSON.stringify({ version: cweData.version, items: cweData.items }, null, 2)
        );

        fs.writeFileSync(
            path.join(CWE_OUTPUT, 'cwe_version.json'),
            JSON.stringify({
                version: cweData.version,
                source: CWE_URL,
                itemCount: cweData.items.length,
                builtAt: new Date().toISOString()
            }, null, 2)
        );

        console.log(`  ✅ CWE index written to ${CWE_OUTPUT}`);

        // --- Build CAPEC Index ---
        console.log('\n[2/2] Building CAPEC Index...');
        const capecXmlPath = path.join(tempDir, 'capec_latest.xml');
        await downloadFile(CAPEC_URL, capecXmlPath);

        const capecXmlContent = fs.readFileSync(capecXmlPath, 'utf-8');
        console.log(`  Parsing CAPEC XML (${(capecXmlContent.length / 1024 / 1024).toFixed(1)} MB)...`);

        const capecData = parseCAPECXml(capecXmlContent);
        console.log(`  Found ${capecData.items.length} CAPEC entries`);

        // Write CAPEC index
        fs.writeFileSync(
            path.join(CAPEC_OUTPUT, 'capec_index.json'),
            JSON.stringify({ version: capecData.version, items: capecData.items }, null, 2)
        );

        fs.writeFileSync(
            path.join(CAPEC_OUTPUT, 'capec_version.json'),
            JSON.stringify({
                version: capecData.version,
                source: CAPEC_URL,
                itemCount: capecData.items.length,
                builtAt: new Date().toISOString()
            }, null, 2)
        );

        console.log(`  ✅ CAPEC index written to ${CAPEC_OUTPUT}`);

        // Cleanup temp files
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log('\n' + '='.repeat(60));
        console.log('✅ KB Index Build Complete!');
        console.log('='.repeat(60));
        console.log(`\nSummary:`);
        console.log(`  CWE:   ${cweData.items.length} entries (v${cweData.version})`);
        console.log(`  CAPEC: ${capecData.items.length} entries (v${capecData.version})`);
        console.log(`\nOutput files:`);
        console.log(`  ${path.join(CWE_OUTPUT, 'cwe_index.json')}`);
        console.log(`  ${path.join(CAPEC_OUTPUT, 'capec_index.json')}`);

    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    buildKBIndexes();
}

module.exports = { buildKBIndexes, parseCWEXml, parseCAPECXml };


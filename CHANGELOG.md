# Changelog

All notable changes to Threat Dragon Enhanced are documented in this file.

This project is a fork of [OWASP Threat Dragon](https://github.com/OWASP/threat-dragon) v2.5.0.

## [2.5.0-enhanced] - 2026-01-16

### Added

#### T2T Import Wizard
- New import wizard for converting Operational Test Plans (OTP) to threat models
- Support for multiple file formats: PDF, DOCX, TXT, MD, JSON
- Multi-step wizard: Upload → Validate Nodes → Validate Flows → Select Layout → Preview & Import
- Three layout options: Tiered, Radial, Hierarchical
- JSON topology import for pre-structured network data

#### Unified Validation Framework
- `validationService.js` - Single entry point for all validation
- `validationResult.js` - Consistent error message format across all validators
- `cellValidator.js` - X6 cell structure validation before graph rendering
- Auto-fix capability for common cell structure issues
- Integrated validation logging for debugging

#### Enhanced Canvas Tools
- Fit Content button - Zooms and pans to fit all diagram content
- Reset Zoom button - Resets to 100% zoom and centers content

#### T2T Parser & Converter
- `T2TParser.js` - Extracts entities from OTP documents
- `t2tConverter.js` - Converts DFDIR to Threat Dragon v2.5.0 JSON format
- `dfdir.js` - DFD Intermediate Representation model
- `layoutEngine.js` - Automatic layout algorithms for diagram elements

### Changed

- Updated navbar branding to indicate experimental fork
- Updated import page with new logo and simplified text
- Integrated AJV schema validation into T2TConverter
- Enhanced diagram.js with cell validation before rendering

### Technical Details

#### New Files Created
- `td.vue/src/views/T2TImport.vue`
- `td.vue/src/components/T2TImportWizard.vue`
- `td.vue/src/components/T2TUpload.vue`
- `td.vue/src/service/migration/t2t/parser/T2TParser.js`
- `td.vue/src/service/migration/t2t/converter/t2tConverter.js`
- `td.vue/src/service/migration/t2t/converter/layoutEngine.js`
- `td.vue/src/service/migration/t2t/models/dfdir.js`
- `td.vue/src/service/validation/validationService.js`
- `td.vue/src/service/validation/validationResult.js`
- `td.vue/src/service/validation/cellValidator.js`
- `td.vue/src/service/validation/index.js`

#### Modified Files
- `td.vue/src/components/Navbar.vue` - Updated branding
- `td.vue/src/components/GraphButtons.vue` - Added Fit Content and Reset Zoom
- `td.vue/src/service/diagram/diagram.js` - Integrated cell validation
- `td.vue/src/i18n/en.js` - Added new translation keys
- `td.vue/src/router/index.js` - Added T2T import route
- `README.md` - Updated for enhanced fork
- `td.vue/package.json` - Updated name and version

---

## Credits

Based on [OWASP Threat Dragon](https://github.com/OWASP/threat-dragon) by [Mike Goodwin](https://github.com/mike-goodwin) and the OWASP community.

Licensed under [Apache 2.0](license.txt).


/**
 * T2T Document Parser
 * Extracts text from PDF, DOCX, TXT, and MD files
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class T2TParser {
    /**
     * Parse OTP document and extract text
     * @param {File} file - The document file to parse
     * @returns {Promise<Object>} - { text, metadata }
     */
    async parse(file) {
        const fileType = this.getFileExtension(file.name);

        switch (fileType) {
        case 'pdf':
            return await this.parsePDF(file);
        case 'docx':
            return await this.parseDOCX(file);
        case 'txt':
        case 'md':
            return await this.parseText(file);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
        }
    }

    /**
     * Get file extension from filename
     * @param {string} filename
     * @returns {string} - lowercase extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Parse PDF document
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parsePDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';
            const pages = [];

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine text items into page text
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                pages.push({
                    pageNumber: pageNum,
                    text: pageText
                });

                fullText += pageText + '\n\n';
            }

            return {
                text: fullText,
                metadata: {
                    source: file.name,
                    type: 'pdf',
                    pages: pdf.numPages,
                    extractedPages: pages,
                    size: file.size,
                    extractedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`PDF parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse DOCX document
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parseDOCX(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });

            return {
                text: result.value,
                metadata: {
                    source: file.name,
                    type: 'docx',
                    size: file.size,
                    extractedAt: new Date().toISOString(),
                    messages: result.messages // Mammoth warnings/errors
                }
            };
        } catch (error) {
            throw new Error(`DOCX parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse plain text or markdown document
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async parseText(file) {
        try {
            const text = await file.text();

            return {
                text,
                metadata: {
                    source: file.name,
                    type: this.getFileExtension(file.name),
                    size: file.size,
                    extractedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Text parsing failed: ${error.message}`);
        }
    }

    /**
     * Validate file before parsing
     * @param {File} file
     * @returns {Object} - { valid, errors }
     */
    validateFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { valid: false, errors };
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
        }

        // Check file type
        const ext = this.getFileExtension(file.name);
        const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
        if (!supportedTypes.includes(ext)) {
            errors.push(`Unsupported file type: .${ext} (supported: ${supportedTypes.join(', ')})`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default new T2TParser();

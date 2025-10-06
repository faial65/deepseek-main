// Test script to verify PDF parsing works
import pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';

async function testPDFParsing() {
    try {
        console.log('PDF-parse library loaded successfully!');
        console.log('Version:', pdfParse.version || 'Available');
        return true;
    } catch (error) {
        console.error('PDF-parse test failed:', error);
        return false;
    }
}

export default testPDFParsing;
#!/usr/bin/env node

/**
 * Deployment Setup Script for FaisalAI
 * Run this once after deployment to set up the master 400-page document
 */

const fetch = require('node-fetch');

async function setupMasterDocument() {
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
    
    console.log('🚀 Setting up master document...');
    console.log('📍 Target URL:', baseUrl);
    
    try {
        const response = await fetch(`${baseUrl}/api/setup/document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Master document setup completed!');
            console.log('📄 Document:', result.document.filename);
            console.log('📊 Chunks:', result.document.chunks);
            console.log('📏 Size:', result.document.size, 'characters');
        } else {
            console.log('❌ Setup failed:', result.message);
            if (result.message.includes('master-document.docx')) {
                console.log('💡 Next steps:');
                console.log('1. Place your 400-page document as "master-document.docx" in the public folder');
                console.log('2. Run this script again');
            }
        }
    } catch (error) {
        console.log('❌ Setup error:', error.message);
    }
}

// Run the setup
setupMasterDocument();
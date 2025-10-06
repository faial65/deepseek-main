import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import DocumentUploadTest from './DocumentUploadTest';

const QuickTest = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadTest, setShowUploadTest] = useState(false);
    const { user } = useAppContext();

    const testEndpoints = async () => {
        console.log('🧪 Testing all endpoints...');
        
        try {
            // Test 1: Basic test endpoint
            console.log('Testing /api/test...');
            const test1 = await axios.get('/api/test');
            console.log('✅ /api/test:', test1.data);
            
            // Test 2: Library imports
            console.log('Testing /api/test-imports...');
            const test2 = await axios.get('/api/test-imports');
            console.log('✅ /api/test-imports:', test2.data);
            
            // Test 3: Simple upload endpoint
            console.log('Testing /api/documents/upload-simple...');
            const formData = new FormData();
            formData.append('file', new Blob(['Hello World'], { type: 'text/plain' }), 'test.txt');
            
            const test3 = await axios.post('/api/documents/upload-simple', formData);
            console.log('✅ /api/documents/upload-simple:', test3.data);
            
            toast.success('All tests passed!');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            toast.error(`Test failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const testMemoryOptimized = async () => {
        console.log('🧪 Testing memory-optimized upload...');
        setIsUploading(true);
        
        try {
            // Create a test document with some content
            const testContent = "This is a test document for memory-optimized processing. ".repeat(50);
            const formData = new FormData();
            formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'memory-test.txt');
            
            console.log('Testing /api/documents/upload-lite...');
            const response = await axios.post('/api/documents/upload-lite', formData);
            console.log('✅ Memory-optimized upload:', response.data);
            
            toast.success('Memory-optimized upload successful!');
            
        } catch (error) {
            console.error('❌ Memory test failed:', error);
            toast.error(`Memory test failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) {
        return <div className="p-4 text-white">Please login to test</div>;
    }

    return (
        <>
            <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg border border-gray-600 z-50">
                <h3 className="text-white font-bold mb-2">Debug Panel</h3>
                <div className="space-y-2">
                    <button
                        onClick={testEndpoints}
                        disabled={isUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded block w-full"
                    >
                        Test All Endpoints
                    </button>
                    <button
                        onClick={testMemoryOptimized}
                        disabled={isUploading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded block w-full"
                    >
                        {isUploading ? 'Testing...' : 'Test Memory Upload'}
                    </button>
                    <button
                        onClick={() => setShowUploadTest(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded block w-full"
                    >
                        Test File Upload
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Check console for details</p>
            </div>

            <DocumentUploadTest 
                isOpen={showUploadTest}
                onClose={() => setShowUploadTest(false)}
                onDocumentUploaded={(doc) => {
                    console.log('Document uploaded:', doc);
                    toast.success(`Document "${doc.filename}" uploaded successfully!`);
                }}
            />
        </>
    );
};

export default QuickTest;
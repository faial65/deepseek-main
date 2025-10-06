import React, { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';

const DocumentUploadTest = ({ isOpen, onClose, onDocumentUploaded }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const { user } = useAppContext();

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file) => {
        if (!user) {
            toast.error('Please login to upload documents');
            return;
        }

        console.log('🧪 Testing file upload with:', file.name, file.type, file.size);

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Test with simple endpoint first
            console.log('🧪 Testing basic upload...');
            const testResponse = await axios.post('/api/test', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ Test response:', testResponse.data);

            if (testResponse.data.success) {
                toast.success('Test upload successful! Now trying real upload...');
                
                // Now try the real upload
                const response = await axios.post('/api/documents/upload-simple', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                console.log('✅ Simple upload response:', response.data);

                if (response.data.success) {
                    toast.success('Simple upload successful! Now trying full processing...');
                    
                    // If simple works, try the lightweight upload
                    try {
                        const lightResponse = await axios.post('/api/documents/upload-lite', formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        });

                        if (lightResponse.data.success) {
                            toast.success('Document uploaded and processed successfully!');
                            onDocumentUploaded(lightResponse.data.data);
                            onClose();
                        } else {
                            toast.error(lightResponse.data.message || 'Processing failed');
                        }
                    } catch (lightError) {
                        console.error('Lightweight processing error:', lightError);
                        toast.error('Processing failed: ' + (lightError.response?.data?.message || lightError.message));
                    }
                } else {
                    toast.error(response.data.message || 'Simple upload failed');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#292a2d] rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Upload Document (Test Mode)</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={isUploading}
                    >
                        <Image src={assets.sidebar_close_icon} alt="Close" className="w-5 h-5" />
                    </button>
                </div>

                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        dragActive 
                            ? 'border-blue-400 bg-blue-400/10' 
                            : 'border-gray-500 hover:border-gray-400'
                    } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-600/30 rounded-full flex items-center justify-center">
                            <Image src={assets.copy_icon} alt="Upload" className="w-8 h-8 opacity-60" />
                        </div>
                        
                        <div className="text-white/80">
                            <p className="text-lg font-medium mb-2">
                                {isUploading ? 'Testing upload...' : 'Drag & drop your document'}
                            </p>
                            <p className="text-sm text-white/60">
                                or click to browse files
                            </p>
                            <p className="text-xs text-yellow-400 mt-2">
                                Testing mode - check console for details
                            </p>
                        </div>

                        <input
                            type="file"
                            id="file-upload-test"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".docx,.doc,.txt"
                            disabled={isUploading}
                        />
                        
                        <label
                            htmlFor="file-upload-test"
                            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors ${
                                isUploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isUploading ? 'Testing...' : 'Browse Files'}
                        </label>
                    </div>
                </div>

                <div className="mt-4 text-sm text-white/60">
                    <p className="mb-2">Currently supported formats:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Word documents (.docx, .doc)</li>
                        <li>Text files (.txt)</li>
                    </ul>
                    <p className="mt-2 text-yellow-400">📄 PDF support coming soon!</p>
                    <p className="mt-1">Maximum file size: 50MB</p>
                </div>

                {isUploading && (
                    <div className="mt-4 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-white/80">Testing upload...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUploadTest;
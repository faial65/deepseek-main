import React, { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';

const DocumentUpload = ({ isOpen, onClose, onDocumentUploaded }) => {
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

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            toast.error('File size must be less than 50MB');
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload PDF, DOCX, DOC, or TXT files only');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use free version by default
            const response = await axios.post('/api/documents/upload-free', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                toast.success('Document uploaded successfully!');
                onDocumentUploaded(response.data.data);
                onClose();
            } else {
                toast.error(response.data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#292a2d] rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Upload Document</h2>
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
                                {isUploading ? 'Processing...' : 'Drag & drop your document'}
                            </p>
                            <p className="text-sm text-white/60">
                                or click to browse files
                            </p>
                        </div>

                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.docx,.doc,.txt"
                            disabled={isUploading}
                        />
                        
                        <label
                            htmlFor="file-upload"
                            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors ${
                                isUploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isUploading ? 'Uploading...' : 'Browse Files'}
                        </label>
                    </div>
                </div>

                <div className="mt-4 text-sm text-white/60">
                    <p className="mb-2">Supported formats:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>PDF documents (.pdf)</li>
                        <li>Word documents (.docx, .doc)</li>
                        <li>Text files (.txt)</li>
                    </ul>
                    <p className="mt-2">Maximum file size: 50MB</p>
                </div>

                {isUploading && (
                    <div className="mt-4 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-white/80">Processing document...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUpload;
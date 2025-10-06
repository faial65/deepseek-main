import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';

const DocumentList = ({ isOpen, onClose, onDocumentSelect }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAppContext();

    useEffect(() => {
        if (isOpen && user) {
            fetchDocuments();
        }
    }, [isOpen, user]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/documents/list');
            if (response.data.success) {
                setDocuments(response.data.data);
            } else {
                toast.error('Failed to fetch documents');
            }
        } catch (error) {
            console.error('Fetch documents error:', error);
            toast.error('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) {
            return assets.copy_icon; // You can add a PDF specific icon
        } else if (mimeType.includes('word')) {
            return assets.copy_icon; // You can add a Word specific icon
        } else {
            return assets.copy_icon;
        }
    };

    const handleDocumentSelect = (document) => {
        onDocumentSelect(document);
        onClose();
        toast.success(`Selected: ${document.filename}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#292a2d] rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Your Documents</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Image src={assets.sidebar_close_icon} alt="Close" className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-white/80">Loading documents...</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Image src={assets.copy_icon} alt="No documents" className="w-8 h-8 opacity-60" />
                            </div>
                            <p className="text-white/60">No documents uploaded yet</p>
                            <p className="text-white/40 text-sm mt-2">Upload a document to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc._id}
                                    onClick={() => handleDocumentSelect(doc)}
                                    className="p-4 bg-[#3a3b3f] hover:bg-[#404045] rounded-xl cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                            <Image 
                                                src={getFileIcon(doc.mimeType)} 
                                                alt="File" 
                                                className="w-5 h-5 opacity-80" 
                                            />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                                                {doc.filename}
                                            </h3>
                                            
                                            <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                <span>•</span>
                                                <span>{formatDate(doc.uploadedAt)}</span>
                                                {doc.chunks && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{doc.chunks.length} chunks</span>
                                                    </>
                                                )}
                                            </div>

                                            <div className="mt-2 text-xs text-white/40">
                                                Click to use this document for Q&A
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Image 
                                                src={assets.arrow_icon} 
                                                alt="Select" 
                                                className="w-4 h-4" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-600">
                    <p className="text-sm text-white/60 text-center">
                        Select a document to start asking questions about its content
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DocumentList;
// Configuration for document processing
export const EMBEDDING_CONFIG = {
    // Set to 'free' for TF-IDF embeddings or 'openai' for OpenAI embeddings
    mode: 'free', // Change to 'openai' if you want to use OpenAI embeddings
    
    // API endpoints based on mode
    uploadEndpoint: '/api/documents/upload-free', // or '/api/documents/upload'
    chatEndpoint: '/api/chat/groq-free', // or '/api/chat/groq'
    
    // Embedding settings
    chunkSize: 1000,
    chunkOverlap: 200,
    maxRelevantChunks: 5,
    similarityThreshold: 0.1, // Lower for TF-IDF, higher (0.7) for OpenAI
};

export const getConfig = () => {
    if (EMBEDDING_CONFIG.mode === 'openai' && !process.env.OPENAI_API_KEY) {
        console.warn('OpenAI mode selected but API key not found, falling back to free mode');
        return {
            ...EMBEDDING_CONFIG,
            mode: 'free',
            uploadEndpoint: '/api/documents/upload-free',
            chatEndpoint: '/api/chat/groq-free',
            similarityThreshold: 0.1
        };
    }
    
    return EMBEDDING_CONFIG;
};
# FaisalAI - 400-Page Document Setup

This system automatically loads a pre-uploaded 400-page document for all users to query.

## 🚀 Deployment Setup

### Step 1: Add Your Document
Place your 400-page document in the public folder:
```
public/master-document.docx
```

### Step 2: Auto-Setup (Option A - Automatic)
The system will automatically process the document when the first user accesses it.

### Step 3: Manual Setup (Option B - Manual)
If you prefer to set it up immediately:

```bash
# For local development
curl -X POST http://localhost:3000/api/setup/document

# For production
curl -X POST https://your-app.vercel.app/api/setup/document
```

## 📋 How It Works

1. **Document Placement**: Place `master-document.docx` in `/public/` folder
2. **Auto-Processing**: System automatically processes the document on first access
3. **Global Access**: All users query the same 400-page knowledge base
4. **No User Uploads**: Users don't need to upload anything

## 🔍 Verification

Check if the document is properly loaded:
```bash
# Check document status
GET /api/documents/default

# Should return:
{
  "success": true,
  "document": {
    "_id": "...",
    "filename": "Master Knowledge Base (400 pages)",
    "chunks": 100+
  }
}
```

## 🎯 User Experience

- New users sign up and can immediately ask questions
- All questions are answered based on the 400-page document
- No knowledge base UI is shown (hidden but functional)
- Automatic chat naming based on user questions

## 🔧 Maintenance

- Replace `public/master-document.docx` to update the knowledge base
- Call `/api/setup/document` after replacing the file
- The system uses the latest active document automatically
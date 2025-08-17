# File Upload Feature Implementation Overview

## 🏗️ **Overall Architecture**

The file upload feature follows a **multimodal message approach** where files are processed and embedded directly into chat messages, requiring no database schema changes.

### **Data Flow:**
```
useFileUpload Hook → EnhancedChatInput → LangGraphService → FastAPI /chat/with-files → File Processor → Agent
```

## 🔧 **Backend Implementation (FastAPI Service)**

### **1. Core Endpoint**
```python
@router.post("/chat/with-files")
async def stream_chat_with_files(
    message: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    thread_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    # ... other parameters
):
    # Process uploaded files first
    file_content_blocks = []
    if files and len(files) > 0 and files[0] is not None:
        file_content_blocks = await process_uploaded_files(files)
```

**Location:** `halo-onz-genone-agent/fastapi_service/routes/streaming.py`

### **2. File Processing Pipeline**
```python
async def process_uploaded_files(files: List[UploadFile]) -> List[Dict[str, Any]]:
    """
    Process uploaded files and convert them into content blocks for HumanMessage.
    """
    # Validate all files first
    for file in files:
        validate_file(file)
    
    # Validate total size
    validate_total_size(files)
    
    content_blocks = []
    
    for file in files:
        if file.content_type in ALLOWED_TEXT_CONTENT_TYPES:
            # Text files - direct content extraction
            text_content = await extract_text_content(file)
            content_blocks.append({
                "type": "text",
                "text": f"[File: {file.filename}]\n{text_content}"
            })
```

**Location:** `halo-onz-genone-agent/fastapi_service/utils/file_processor.py`

### **3. Supported File Types & Limits**
- **Text Files (.txt)**: 1MB max - Direct text extraction
- **PDF Files (.pdf)**: 5MB max - Text extraction using PyMuPDF
- **Images (.jpg, .png, .gif)**: 5MB max - Base64 encoding + OCR with EasyOCR
- **Total per message**: 15MB max

### **4. File Processing Features**
- **Text Extraction**: Direct content reading for .txt files
- **PDF Processing**: PyMuPDF for document text extraction
- **Image OCR**: EasyOCR for text extraction from images
- **Base64 Encoding**: Images encoded for multimodal LLM processing
- **Validation**: Content-type and extension validation
- **Size Limits**: Enforced to prevent DoS attacks

## 🎨 **Frontend Implementation (React)**

### **1. useFileUpload Hook**
```typescript
interface UseFileUploadOptions {
  maxFiles?: number
  onError?: (errors: string[]) => void
  onSuccess?: (files: File[]) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  // File validation and size checking
  // State management for selected files
  // Error handling and user feedback
```

**Location:** `halo-onz-genone-app/genone-frontend/src/hooks/useFileUpload.ts`

### **2. Enhanced Chat Input Integration**
```typescript
interface EnhancedChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void
  // ...
  enableFileUpload?: boolean
}

export function EnhancedChatInput({
  onSendMessage,
  // ...
  enableFileUpload = true
}: EnhancedChatInputProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  // Integrates FileUpload component
  // Handles file attachment UI
```

**Location:** `halo-onz-genone-app/genone-frontend/src/components/chat/EnhancedChatInput.tsx`

### **3. API Service Layer**
```typescript
// Create FormData for file upload
const formData = new FormData()
formData.append('message', message)

// Add files
files.forEach((file) => {
  formData.append('files', file)
})

// Add other parameters
if (sessionId) formData.append('session_id', sessionId)
if (threadId) formData.append('thread_id', threadId)

const response = await fetch(`${this.baseUrl}/api/v1/chat/with-files`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Accept': 'text/event-stream',
  },
  body: formData,
})
```

**Location:** `halo-onz-genone-app/genone-frontend/src/lib/langGraphService.ts`

## 🔄 **Key Features**

### **1. Seamless Integration**
- **No Database Changes**: Files stored as message content in existing checkpoint system
- **Same Authentication**: JWT-based auth identical to regular chat
- **Same Streaming**: Server-Sent Events streaming maintained
- **Backward Compatible**: Existing `/chat/stream` endpoint unchanged

### **2. Smart Routing**
The frontend automatically routes requests:
- **Files present** → `/api/v1/chat/with-files` (FormData)
- **No files** → `/api/v1/chat/stream` (JSON)

### **3. Advanced Processing**
- **OCR Support**: Images processed with EasyOCR for text extraction
- **PDF Text Extraction**: Using PyMuPDF for document processing
- **File Validation**: Content-type and extension validation
- **Size Limits**: Prevents DoS attacks with enforced limits

### **4. User Experience**
- **Drag & Drop**: Intuitive file selection
- **File Previews**: Visual indicators with file type icons
- **Progress Feedback**: File processing status
- **Error Handling**: Comprehensive validation and user feedback

## 🧪 **Testing**

The implementation includes comprehensive testing:
- **Unit Tests**: 11/11 passing for file processing
- **Integration Tests**: End-to-end file upload workflows
- **curl Testing**: Backend API validation
- **Frontend Testing**: UI component validation

## 📁 **File Structure**

### Backend Files:
- `halo-onz-genone-agent/fastapi_service/routes/streaming.py` - Main endpoint
- `halo-onz-genone-agent/fastapi_service/utils/file_processor.py` - File processing logic
- `halo-onz-genone-agent/fastapi_service/models.py` - Request/response models

### Frontend Files:
- `halo-onz-genone-app/genone-frontend/src/hooks/useFileUpload.ts` - File upload hook with validation
- `halo-onz-genone-app/genone-frontend/src/components/chat/EnhancedChatInput.tsx` - Chat input integration
- `halo-onz-genone-app/genone-frontend/src/lib/langGraphService.ts` - API service layer

### Documentation:
- `halo-onz-genone-agent/docs/file-upload-architecture-design-20250724.md` - Architecture design
- `halo-onz-genone-agent/docs/file-upload-implementation-report.md` - Implementation details
- `halo-onz-genone-agent/docs/file-upload-test-results.md` - Testing results

## 🚀 **Usage Examples**

### **Text File Analysis**
```bash
curl -X POST "http://localhost:8000/api/v1/chat/with-files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "message=Analyze this requirements document" \
  -F "files=@requirements.txt"
```

### **PDF Document Processing**
```bash
curl -X POST "http://localhost:8000/api/v1/chat/with-files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "message=Summarize this report" \
  -F "files=@report.pdf"
```

### **Image OCR**
```bash
curl -X POST "http://localhost:8000/api/v1/chat/with-files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "message=Extract text from this image" \
  -F "files=@screenshot.png"
```

This architecture provides a robust, scalable file upload system that integrates seamlessly with the existing chat infrastructure while maintaining security and performance standards.

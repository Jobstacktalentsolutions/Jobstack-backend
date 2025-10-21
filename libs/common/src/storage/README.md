# Storage Module

## Purpose

The Storage module provides centralized file management for the JobStack platform, handling document uploads, storage, and metadata tracking. It integrates with cloud storage providers (currently iDrive e2) and maintains a comprehensive document registry in the database.

## How It Works

### Core Components

1. **StorageService**: Main service that orchestrates file operations
2. **Document Entity**: Database entity that tracks all document metadata
3. **Storage Providers**: Pluggable storage backends (iDrive, etc.)
4. **Storage Module**: NestJS module that provides dependency injection

### Document Management Flow

#### Upload Process

1. File validation (size, type, format)
2. Generate unique filename with timestamp
3. Upload to cloud storage provider
4. Create Document entity record with metadata
5. Return document ID and file information

#### Document Tracking

- Every uploaded file creates a Document entity record
- Tracks: fileKey, type, size, mimeType, URL, provider, uploader
- Supports document categorization (CV, Portfolio, Certificate, etc.)
- Maintains audit trail with upload timestamps and user tracking

#### Deletion Process

- **Soft Delete**: Marks document as inactive (preserves audit trail)
- **Hard Delete**: Permanently removes from both storage and database
- Automatic cleanup of orphaned files

### Key Features

- **Multi-Provider Support**: Pluggable architecture for different storage providers
- **Document Metadata**: Comprehensive tracking of all file attributes
- **Type Safety**: Strong typing with TypeScript and validation
- **Audit Trail**: Complete history of document operations
- **Security**: File validation, size limits, and type restrictions
- **Scalability**: Designed to handle high-volume document operations

### Usage Examples

```typescript
// Upload a CV document
const result = await storageService.uploadFile(file, {
  documentType: DocumentType.CV,
  uploadedBy: userId,
  description: 'Job seeker CV',
});

// Get document by ID
const document = await storageService.getDocument(documentId);

// Delete document permanently
await storageService.deleteDocument(documentId);
```

### Integration Points

- **User Module**: Links documents to user profiles
- **Jobseeker Profile**: CV documents are referenced via Document entity
- **Background Jobs**: Document cleanup and maintenance tasks
- **Notification System**: Document upload confirmations and alerts

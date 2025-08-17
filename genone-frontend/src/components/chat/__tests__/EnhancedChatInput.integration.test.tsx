import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnhancedChatInput } from '../EnhancedChatInput'

// Mock File constructor
class MockFile {
  name: string
  size: number
  type: string

  constructor(name: string, size: number, type: string) {
    this.name = name
    this.size = size
    this.type = type
  }
}

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string): File => {
  return new MockFile(name, size, type) as unknown as File
}

// Mock alert function
const mockAlert = vi.fn()
global.alert = mockAlert

describe('EnhancedChatInput Integration Tests', () => {
  const mockOnSendMessage = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAlert.mockClear()
  })

  describe('File Upload Integration', () => {
    it('should handle valid file upload successfully', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      // Find the file input by test-id
      const fileInput = screen.getByTestId('file-input')

      // Create valid files
      const validFiles = [
        createMockFile('test.txt', 1000, 'text/plain'),
        createMockFile('test.pdf', 2000, 'application/pdf')
      ]

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: validFiles,
        writable: false,
      })
      fireEvent.change(fileInput)

      // Wait for files to be processed
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument()
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      // Check file size display
      expect(screen.getByText(/1000 Bytes/)).toBeInTheDocument()
      expect(screen.getByText(/1.95 KB/)).toBeInTheDocument()

      // No error should be shown
      expect(mockAlert).not.toHaveBeenCalled()
    })

    it('should reject oversized files and show error', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const fileInput = screen.getByTestId('file-input')

      // Create oversized file (2MB text file, limit is 1MB)
      const oversizedFiles = [
        createMockFile('large.txt', 2 * 1024 * 1024, 'text/plain')
      ]

      Object.defineProperty(fileInput, 'files', {
        value: oversizedFiles,
        writable: false,
      })
      fireEvent.change(fileInput)

      // Wait for error to be shown
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('File too large')
        )
      })

      // File should not be added
      expect(screen.queryByText('large.txt')).not.toBeInTheDocument()
    })

    it('should reject unsupported file types', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const fileInput = screen.getByTestId('file-input')

      // Create unsupported file
      const unsupportedFiles = [
        createMockFile('test.exe', 1000, 'application/x-executable')
      ]

      Object.defineProperty(fileInput, 'files', {
        value: unsupportedFiles,
        writable: false,
      })
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Unsupported file type')
        )
      })

      expect(screen.queryByText('test.exe')).not.toBeInTheDocument()
    })

    it('should enforce file count limit', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const fileInput = screen.getByTestId('file-input')

      // Create 4 files (exceeds limit of 3)
      const tooManyFiles = [
        createMockFile('file1.txt', 1000, 'text/plain'),
        createMockFile('file2.txt', 1000, 'text/plain'),
        createMockFile('file3.txt', 1000, 'text/plain'),
        createMockFile('file4.txt', 1000, 'text/plain')
      ]

      Object.defineProperty(fileInput, 'files', {
        value: tooManyFiles,
        writable: false,
      })
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Too many files')
        )
      })

      // No files should be added
      expect(screen.queryByText('file1.txt')).not.toBeInTheDocument()
    })

    it('should enforce total size limit', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const fileInput = screen.getByRole('textbox').parentElement?.parentElement?.querySelector('input[type="file"]')

      // Create files that exceed total size limit (16MB > 15MB limit)
      const largeTotalFiles = [
        createMockFile('file1.pdf', 8 * 1024 * 1024, 'application/pdf'), // 8MB
        createMockFile('file2.pdf', 8 * 1024 * 1024, 'application/pdf')  // 8MB = 16MB total
      ]

      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: largeTotalFiles,
          writable: false,
        })
        fireEvent.change(fileInput)
      }

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Total file size too large')
        )
      })

      expect(screen.queryByText('file1.pdf')).not.toBeInTheDocument()
    })

    it('should allow removing files', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const fileInput = screen.getByRole('textbox').parentElement?.parentElement?.querySelector('input[type="file"]')

      const validFiles = [
        createMockFile('test1.txt', 1000, 'text/plain'),
        createMockFile('test2.txt', 2000, 'text/plain')
      ]

      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: validFiles,
          writable: false,
        })
        fireEvent.change(fileInput)
      }

      await waitFor(() => {
        expect(screen.getByText('test1.txt')).toBeInTheDocument()
        expect(screen.getByText('test2.txt')).toBeInTheDocument()
      })

      // Find and click remove button for first file
      const removeButtons = screen.getAllByTitle('Remove file')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('test1.txt')).not.toBeInTheDocument()
        expect(screen.getByText('test2.txt')).toBeInTheDocument()
      })
    })

    it('should disable attachment button when at file limit', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const fileInput = screen.getByRole('textbox').parentElement?.parentElement?.querySelector('input[type="file"]')

      // Add 3 files (at limit)
      const maxFiles = [
        createMockFile('file1.txt', 1000, 'text/plain'),
        createMockFile('file2.txt', 1000, 'text/plain'),
        createMockFile('file3.txt', 1000, 'text/plain')
      ]

      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: maxFiles,
          writable: false,
        })
        fireEvent.change(fileInput)
      }

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument()
        expect(screen.getByText('file2.txt')).toBeInTheDocument()
        expect(screen.getByText('file3.txt')).toBeInTheDocument()
      })

      // Attachment button should be disabled
      const attachButton = screen.getByTitle('Maximum 3 files allowed')
      expect(attachButton).toBeDisabled()
    })
  })

  describe('Message Sending with Files', () => {
    it('should send message with files and clear them', async () => {
      render(
        <EnhancedChatInput
          onSendMessage={mockOnSendMessage}
          onCancel={mockOnCancel}
          enableFileUpload={true}
        />
      )

      const textarea = screen.getByRole('textbox')
      const fileInput = screen.getByRole('textbox').parentElement?.parentElement?.querySelector('input[type="file"]')

      // Add files
      const validFiles = [
        createMockFile('test.txt', 1000, 'text/plain')
      ]

      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: validFiles,
          writable: false,
        })
        fireEvent.change(fileInput)
      }

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument()
      })

      // Type message
      fireEvent.change(textarea, { target: { value: 'Test message with file' } })

      // Send message
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith(
          'Test message with file',
          expect.arrayContaining([
            expect.objectContaining({
              name: 'test.txt',
              type: 'text/plain'
            })
          ])
        )
      })

      // Files should be cleared after sending
      await waitFor(() => {
        expect(screen.queryByText('test.txt')).not.toBeInTheDocument()
      })
    })
  })
})

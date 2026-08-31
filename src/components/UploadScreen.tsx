import { useCallback, useState } from 'react'
import { AffiliationNotice } from './AffiliationNotice'

interface UploadScreenProps {
  onFilesSelected: (files: FileList) => void
  onBack: () => void
  isProcessing: boolean
  error?: string
}

export function UploadScreen({ onFilesSelected, onBack, isProcessing, error }: UploadScreenProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files)
      }
    },
    [onFilesSelected],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files)
      }
    },
    [onFilesSelected],
  )

  return (
    <div className="screen">
      <header className="hero">
        <h1>Upload your Harvest exports</h1>
        <AffiliationNotice />
        <p className="subtitle privacy-notice">
          Your Harvest files are analysed in your browser and are not uploaded.
        </p>
      </header>

      <section
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📁</div>
        <p>Drag and drop your Harvest export files here</p>
        <p className="upload-formats">CSV, XLSX, ZIP, PDF</p>
        <label className="btn-secondary">
          Choose files
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.zip,.pdf,.txt"
            onChange={handleFileInput}
            hidden
          />
        </label>
      </section>

      {isProcessing && <p className="processing">Analysing your archive…</p>}
      {error && <p className="error">{error}</p>}

      <button className="btn-text" onClick={onBack}>
        ← Back to checklist
      </button>
    </div>
  )
}

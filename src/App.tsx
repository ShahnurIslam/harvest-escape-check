import { useState } from 'react'
import { ChecklistScreen } from './components/ChecklistScreen'
import { UploadScreen } from './components/UploadScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { processBrowserFiles } from './pipeline/process-archive'
import type { AuditResult } from './types/audit'
import type { SchemaFingerprintReport } from './types/diagnostic'

type Screen = 'checklist' | 'upload' | 'results'

function App() {
  const [screen, setScreen] = useState<Screen>('checklist')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [schemaFingerprint, setSchemaFingerprint] = useState<SchemaFingerprintReport | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>()

  const handleFilesSelected = async (fileList: FileList) => {
    setIsProcessing(true)
    setError(undefined)
    try {
      const { audit, schemaFingerprint: fingerprint } = await processBrowserFiles(fileList)
      setResult(audit)
      setSchemaFingerprint(fingerprint)
      setScreen('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="app">
      {screen === 'checklist' && <ChecklistScreen onContinue={() => setScreen('upload')} />}
      {screen === 'upload' && (
        <UploadScreen
          onFilesSelected={handleFilesSelected}
          onBack={() => setScreen('checklist')}
          isProcessing={isProcessing}
          error={error}
        />
      )}
      {screen === 'results' && result && (
        <ResultsScreen
          result={result}
          schemaFingerprint={schemaFingerprint ?? undefined}
          onStartOver={() => {
            setResult(null)
            setSchemaFingerprint(null)
            setScreen('checklist')
          }}
        />
      )}
    </div>
  )
}

export default App

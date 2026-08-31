import JSZip from 'jszip'
import { detectUploadedFile, markDuplicates } from '../detector/detector'
import { createEmptyArchive, parseDetectedFile } from '../parsers/index'
import { runAudit } from '../audit/engine'
import type { AuditResult } from '../types/audit'
import type { NormalisedArchive, UploadedFile } from '../types/models'
import { generateSchemaFingerprint } from '../diagnostic/schema-fingerprint'
import type { SchemaFingerprintReport } from '../types/diagnostic'

export async function readFileAsUploaded(file: File): Promise<UploadedFile> {
  const content = await file.arrayBuffer()
  const isText =
    file.name.toLowerCase().endsWith('.csv') ||
    file.type.includes('csv') ||
    file.type === 'text/plain'

  return {
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    content,
    textContent: isText ? new TextDecoder('utf-8').decode(content) : undefined,
  }
}

export async function extractZipFiles(file: File): Promise<UploadedFile[]> {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const files: UploadedFile[] = []

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue
    const content = await entry.async('arraybuffer')
    const filename = path.split('/').pop() ?? path
    const isText = filename.toLowerCase().endsWith('.csv')

    files.push({
      filename,
      mimeType: isText ? 'text/csv' : 'application/octet-stream',
      content,
      textContent: isText ? new TextDecoder('utf-8').decode(content) : undefined,
    })
  }

  return files
}

export async function processUploadedFiles(files: UploadedFile[]): Promise<{
  archive: NormalisedArchive
  audit: AuditResult
  schemaFingerprint: SchemaFingerprintReport
}> {
  let archive = createEmptyArchive()
  const allFiles: UploadedFile[] = []

  for (const file of files) {
    if (file.filename.toLowerCase().endsWith('.zip')) {
      const zip = new JSZip()
      const zipData = await zip.loadAsync(file.content)
      for (const [path, entry] of Object.entries(zipData.files)) {
        if (entry.dir) continue
        const content = await entry.async('arraybuffer')
        const filename = path.split('/').pop() ?? path
        const isText = filename.toLowerCase().endsWith('.csv')
        allFiles.push({
          filename,
          mimeType: isText ? 'text/csv' : 'application/octet-stream',
          content,
          textContent: isText ? new TextDecoder('utf-8').decode(content) : undefined,
        })
      }
    } else {
      allFiles.push(file)
    }
  }

  const detections = await Promise.all(allFiles.map((f) => detectUploadedFile(f)))
  const marked = markDuplicates(detections)

  const processed = new Set<string>()

  for (let i = 0; i < allFiles.length; i++) {
    const detection = marked[i]
    if (detection.isDuplicate) {
      archive.detectedFiles.push(detection)
      continue
    }

    const key = detection.filename.toLowerCase()
    if (processed.has(key)) continue
    processed.add(key)

    archive.detectedFiles.push(detection)
    archive = parseDetectedFile(allFiles[i], detection, archive)
  }

  const audit = runAudit(archive)
  const schemaFingerprint = await generateSchemaFingerprint(allFiles, archive)
  return { archive, audit, schemaFingerprint }
}

export function processArchiveData(archive: NormalisedArchive): AuditResult {
  return runAudit(archive)
}

export async function processBrowserFiles(fileList: FileList | File[]): Promise<{
  archive: NormalisedArchive
  audit: AuditResult
  schemaFingerprint: SchemaFingerprintReport
}> {
  const files: UploadedFile[] = []

  for (const file of fileList) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const extracted = await extractZipFiles(file)
      files.push(...extracted)
    } else {
      files.push(await readFileAsUploaded(file))
    }
  }

  return processUploadedFiles(files)
}

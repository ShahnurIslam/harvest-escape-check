import { generateFixture, HEALTHY_CONFIG, fixtureToUploadedFiles } from '../src/fixtures/generator'
import { processUploadedFiles } from '../src/pipeline/process-archive'

async function main() {
  const fixture = generateFixture(HEALTHY_CONFIG)
  const files = fixtureToUploadedFiles(fixture)
  const { audit } = await processUploadedFiles(files)
  const critical = audit.findings.filter((f) => f.severity === 'critical')
  const warnings = audit.findings.filter((f) => f.severity === 'warning')
  console.log('Critical findings:', JSON.stringify(critical, null, 2))
  console.log('Warnings:', JSON.stringify(warnings, null, 2))
  console.log('Score:', audit.readiness.score)
  console.log('Missing categories:', audit.missingCategories)
}

main()

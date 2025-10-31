/**
 * Encryption diagnostics utilities
 * Provides functions to diagnose and log issues with encrypted data
 */

export interface EncryptionDiagnostics {
  isValid: boolean
  isBase64: boolean
  hasMinimumLength: boolean
  length: number
  details: string
}

/**
 * Diagnose encrypted data to check if it's valid
 * @param encryptedData - The encrypted data string to diagnose
 * @returns Diagnostics object with validation results
 */
export function diagnoseEncryptedData(encryptedData: string): EncryptionDiagnostics {
  const diagnostics: EncryptionDiagnostics = {
    isValid: false,
    isBase64: false,
    hasMinimumLength: false,
    length: 0,
    details: ''
  }

  // Check if data exists
  if (!encryptedData || typeof encryptedData !== 'string') {
    diagnostics.details = 'Data is null, undefined, or not a string'
    return diagnostics
  }

  diagnostics.length = encryptedData.length

  // Check minimum length (salt: 16 bytes, iv: 12 bytes, data: at least 1 byte)
  // Base64 encoding: (16 + 12 + 1) * 4/3 ≈ 39 characters minimum
  diagnostics.hasMinimumLength = encryptedData.length >= 39
  if (!diagnostics.hasMinimumLength) {
    diagnostics.details = `Data too short (${encryptedData.length} chars, minimum 39)`
    return diagnostics
  }

  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  diagnostics.isBase64 = base64Regex.test(encryptedData)
  if (!diagnostics.isBase64) {
    diagnostics.details = 'Data is not valid base64'
    return diagnostics
  }

  // Try to decode base64
  try {
    const decoded = atob(encryptedData)
    if (decoded.length < 29) { // 16 (salt) + 12 (iv) + 1 (data)
      diagnostics.details = `Decoded data too short (${decoded.length} bytes, minimum 29)`
      return diagnostics
    }
    diagnostics.isValid = true
    diagnostics.details = 'Data appears valid'
  } catch (error) {
    diagnostics.details = `Base64 decode failed: ${error instanceof Error ? error.message : 'unknown error'}`
    return diagnostics
  }

  return diagnostics
}

/**
 * Log detailed encryption diagnostics for debugging
 * @param itemId - The ID of the item being diagnosed
 * @param encryptedQuery - The encrypted query data
 * @param encryptedResults - The encrypted results data
 */
export function logEncryptionDiagnostics(
  itemId: string,
  encryptedQuery: string,
  encryptedResults: string
): void {
  const queryDiag = diagnoseEncryptedData(encryptedQuery)
  const resultsDiag = diagnoseEncryptedData(encryptedResults)

  console.group(`🔍 Encryption Diagnostics for item: ${itemId}`)
  
  console.group('📝 Encrypted Query')
  console.log('Valid:', queryDiag.isValid ? '✅' : '❌')
  console.log('Is Base64:', queryDiag.isBase64 ? '✅' : '❌')
  console.log('Has Minimum Length:', queryDiag.hasMinimumLength ? '✅' : '❌')
  console.log('Length:', queryDiag.length, 'chars')
  console.log('Details:', queryDiag.details)
  if (encryptedQuery) {
    console.log('First 50 chars:', encryptedQuery.substring(0, 50) + '...')
  }
  console.groupEnd()

  console.group('📊 Encrypted Results')
  console.log('Valid:', resultsDiag.isValid ? '✅' : '❌')
  console.log('Is Base64:', resultsDiag.isBase64 ? '✅' : '❌')
  console.log('Has Minimum Length:', resultsDiag.hasMinimumLength ? '✅' : '❌')
  console.log('Length:', resultsDiag.length, 'chars')
  console.log('Details:', resultsDiag.details)
  if (encryptedResults) {
    console.log('First 50 chars:', encryptedResults.substring(0, 50) + '...')
  }
  console.groupEnd()

  console.groupEnd()
}

/**
 * Client-side encryption utilities for encrypting user data
 * Uses username as the encryption key for end-to-end encryption
 * 
 * This ensures that:
 * 1. Data is encrypted before being sent to the database
 * 2. Only the user with the correct username can decrypt their data
 * 3. Admins can see encrypted data but cannot decrypt without the username
 */

/**
 * Derive a cryptographic key from the username using PBKDF2
 */
async function deriveKeyFromUsername(username: string, salt: BufferSource): Promise<CryptoKey> {
  // Encode the username
  const encoder = new TextEncoder()
  const usernameBuffer = encoder.encode(username)
  
  // Import the username as a key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    usernameBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derive a key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  
  return key
}

/**
 * Encrypt data using the username as the encryption key
 */
export async function encryptData(data: string, username: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    // Generate a random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Derive key from username
    const key = await deriveKeyFromUsername(username, salt)
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    )
    
    // Combine salt, IV, and encrypted data
    const encryptedArray = new Uint8Array(encryptedBuffer)
    const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(encryptedArray, salt.length + iv.length)
    
    // Convert to base64 for storage
    return arrayBufferToBase64(combined)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data using the username as the decryption key
 */
export async function decryptData(encryptedData: string, username: string): Promise<string> {
  try {
    // Validate inputs
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data: must be a non-empty string')
    }
    if (!username || typeof username !== 'string') {
      throw new Error('Invalid username: must be a non-empty string')
    }

    // Convert from base64
    const combined = base64ToArrayBuffer(encryptedData)
    
    // Validate minimum length (salt + iv + some encrypted data)
    if (combined.length < 28) {
      throw new Error('Invalid encrypted data: too short')
    }
    
    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encryptedArray = combined.slice(28)
    
    // Validate we have encrypted data
    if (encryptedArray.length === 0) {
      throw new Error('Invalid encrypted data: no encrypted content')
    }
    
    // Derive key from username
    const key = await deriveKeyFromUsername(username, salt)
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedArray
    )
    
    // Convert back to string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('Decryption error details:', {
      error,
      encryptedDataLength: encryptedData?.length,
      usernameLength: username?.length,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw new Error('Failed to decrypt data - invalid username or corrupted data')
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  try {
    // Validate base64 string
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 input: must be a non-empty string')
    }

    // Clean the base64 string (remove whitespace)
    const cleanedBase64 = base64.trim().replace(/\s/g, '')
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(cleanedBase64)) {
      throw new Error('Invalid base64 format')
    }

    const binaryString = atob(cleanedBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    console.error('Base64 decode error:', error)
    throw new Error(`Failed to decode base64: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a unique identifier for a user based on their email
 * This is used as the username for encryption
 */
export function getUsernameFromEmail(email: string): string {
  // Use email as the username/encryption key
  return email.toLowerCase().trim()
}

/**
 * Encrypt search history data
 */
export async function encryptSearchHistory(
  query: string,
  results: any[],
  username: string
): Promise<{ encryptedQuery: string; encryptedResults: string }> {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query parameter for encryption')
    }
    if (!Array.isArray(results)) {
      throw new Error('Invalid results parameter for encryption')
    }
    if (!username || typeof username !== 'string') {
      throw new Error('Invalid username parameter for encryption')
    }

    const encryptedQuery = await encryptData(query, username)
    const encryptedResults = await encryptData(JSON.stringify(results), username)
    
    return {
      encryptedQuery,
      encryptedResults
    }
  } catch (error) {
    console.error('Encryption error in encryptSearchHistory:', error)
    throw error
  }
}

/**
 * Decrypt search history data
 */
export async function decryptSearchHistory(
  encryptedQuery: string,
  encryptedResults: string,
  username: string
): Promise<{ query: string; results: any[] }> {
  const query = await decryptData(encryptedQuery, username)
  const resultsJson = await decryptData(encryptedResults, username)
  const results = JSON.parse(resultsJson)
  
  return {
    query,
    results
  }
}

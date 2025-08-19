import { ethers } from "ethers"

declare global {
  interface Window {
    ethereum?: any
  }
}

export interface HealthRecord {
  id: string
  patientAddress: string
  recordHash: string
  timestamp: number
  recordType: string
  providerAddress: string
  encrypted: boolean
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null

  async initialize() {
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      return true
    }
    return false
  }

  async getAccount(): Promise<string | null> {
    if (!this.signer) return null
    return await this.signer.getAddress()
  }

  async signMessage(message: string): Promise<string | null> {
    if (!this.signer) return null
    try {
      return await this.signer.signMessage(message)
    } catch (error) {
      console.error("Error signing message:", error)
      return null
    }
  }

  // Simulate blockchain storage (in a real app, this would interact with smart contracts)
  async storeHealthRecord(record: Omit<HealthRecord, "id" | "timestamp">): Promise<string> {
    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    // In a real implementation, this would call a smart contract
    const fullRecord: HealthRecord = {
      id: recordId,
      timestamp,
      ...record,
    }

    // Store in localStorage for demo (would be blockchain in production)
    const existingRecords = this.getStoredRecords()
    existingRecords.push(fullRecord)
    localStorage.setItem("healthRecords", JSON.stringify(existingRecords))

    return recordId
  }

  getStoredRecords(): HealthRecord[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("healthRecords")
    return stored ? JSON.parse(stored) : []
  }

  async getPatientRecords(patientAddress: string): Promise<HealthRecord[]> {
    const allRecords = this.getStoredRecords()
    return allRecords.filter((record) => record.patientAddress.toLowerCase() === patientAddress.toLowerCase())
  }

  // Encrypt data before storing (simplified for demo)
  encryptData(data: string, key: string): string {
    // In production, use proper encryption like AES
    return btoa(data + key)
  }

  decryptData(encryptedData: string, key: string): string {
    try {
      const decoded = atob(encryptedData)
      return decoded.replace(key, "")
    } catch {
      return "Unable to decrypt"
    }
  }
}

export const web3Service = new Web3Service()

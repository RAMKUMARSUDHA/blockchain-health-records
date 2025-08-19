"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Calendar, Shield, Share2, Download, Lock, Unlock, EyeOff, AlertCircle } from "lucide-react"
import { web3Service, type HealthRecord } from "@/lib/web3"
import { useAuth } from "@/hooks/use-auth"

interface RecordDetailDialogProps {
  record: HealthRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface RecordData {
  recordType: string
  title: string
  description: string
  providerName: string
  providerAddress: string
  date: string
  category: string
  timestamp: number
  patientAddress: string
  attachmentHashes: string[]
}

export function RecordDetailDialog({ record, open, onOpenChange }: RecordDetailDialogProps) {
  const { authData } = useAuth()
  const [recordData, setRecordData] = useState<RecordData | null>(null)
  const [isDecrypted, setIsDecrypted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (record && open) {
      loadRecordData()
    }
  }, [record, open])

  const loadRecordData = async () => {
    if (!record || !authData?.address) return

    setIsLoading(true)
    setError("")

    try {
      let storedData = {}
      try {
        const rawData = localStorage.getItem("recordData")
        if (rawData) {
          // Validate that rawData is valid JSON before parsing
          if (rawData.trim().startsWith("{") || rawData.trim().startsWith("[")) {
            storedData = JSON.parse(rawData)
          } else {
            console.log("[v0] Invalid localStorage format, clearing data")
            localStorage.removeItem("recordData")
          }
        }
      } catch (parseError) {
        console.error("[v0] Failed to parse localStorage data:", parseError)
        localStorage.removeItem("recordData")
      }

      const encryptedData = storedData[record.id]

      if (encryptedData) {
        try {
          console.log("[v0] Attempting to decrypt data for record:", record.id)
          const decryptedData = web3Service.decryptData(encryptedData, authData.address)

          console.log("[v0] Decrypted data type:", typeof decryptedData)
          console.log("[v0] Decrypted data length:", decryptedData?.length)

          // Validate that decryptedData exists and is a string
          if (!decryptedData || typeof decryptedData !== "string") {
            throw new Error("Decrypted data is not a valid string")
          }

          // Clean and validate the decrypted data
          const cleanedData = decryptedData.trim()

          // Check if the cleaned data looks like JSON
          if (!cleanedData.startsWith("{") && !cleanedData.startsWith("[")) {
            throw new Error("Decrypted data does not appear to be JSON")
          }

          // Additional validation: check for common JSON corruption issues
          if (cleanedData.includes("}{") || cleanedData.includes("]}[")) {
            throw new Error("Decrypted data appears to contain concatenated JSON")
          }

          console.log("[v0] Attempting to parse cleaned data:", cleanedData.substring(0, 100) + "...")
          const parsedData: RecordData = JSON.parse(cleanedData)

          // Validate that parsed data has required fields
          if (!parsedData.recordType || !parsedData.title) {
            throw new Error("Parsed data missing required fields")
          }

          setRecordData(parsedData)
          setIsDecrypted(true)
          console.log("[v0] Successfully loaded and decrypted record data")
        } catch (decryptError) {
          console.error("[v0] Failed to decrypt or parse record data:", decryptError)
          // Don't throw here, fall through to mock data
          throw new Error(`Failed to decrypt record data: ${decryptError.message}`)
        }
      } else {
        console.log("[v0] No encrypted data found, using mock data")
        const mockData: RecordData = {
          recordType: record.recordType,
          title: `${record.recordType} - ${new Date(record.timestamp).toLocaleDateString()}`,
          description: `Detailed ${record.recordType.toLowerCase()} results and findings. This is sample data as the original record could not be decrypted.`,
          providerName: "Healthcare Provider",
          providerAddress: record.providerAddress,
          date: new Date(record.timestamp).toISOString().split("T")[0],
          category: getCategoryFromType(record.recordType),
          timestamp: record.timestamp,
          patientAddress: record.patientAddress,
          attachmentHashes: [],
        }
        setRecordData(mockData)
        setIsDecrypted(true)
      }
    } catch (error: any) {
      console.error("[v0] Error loading record data:", error)
      const fallbackData: RecordData = {
        recordType: record.recordType,
        title: `${record.recordType} - ${new Date(record.timestamp).toLocaleDateString()}`,
        description: `This record could not be loaded due to decryption issues. Please contact support if this problem persists.`,
        providerName: "Healthcare Provider",
        providerAddress: record.providerAddress,
        date: new Date(record.timestamp).toISOString().split("T")[0],
        category: getCategoryFromType(record.recordType),
        timestamp: record.timestamp,
        patientAddress: record.patientAddress,
        attachmentHashes: [],
      }
      setRecordData(fallbackData)
      setIsDecrypted(true)
      setError("Record data could not be decrypted - showing fallback information")
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryFromType = (recordType: string): string => {
    const categoryMap: { [key: string]: string } = {
      "Blood Test": "Laboratory",
      "X-Ray": "Imaging",
      MRI: "Imaging",
      "CT Scan": "Imaging",
      Prescription: "Medication",
      Vaccination: "Preventive Care",
      "Surgery Report": "Surgery",
      "Lab Results": "Laboratory",
      "Consultation Notes": "Consultation",
      "Discharge Summary": "Emergency",
    }
    return categoryMap[recordType] || "General"
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleShare = () => {
    // In production, this would open a sharing dialog
    alert("Sharing functionality would allow you to grant access to healthcare providers")
  }

  const handleDownload = () => {
    // In production, this would download the record as PDF
    alert("Download functionality would generate a PDF of the record")
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Health Record Details
          </DialogTitle>
          <DialogDescription>Secure, encrypted health record stored on the blockchain</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Record Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{recordData?.title || record.recordType}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(record.timestamp)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.encrypted ? "default" : "destructive"}>
                      {record.encrypted ? (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Encrypted
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 mr-1" />
                          Unencrypted
                        </>
                      )}
                    </Badge>
                    {recordData?.category && <Badge variant="outline">{recordData.category}</Badge>}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Record Content */}
            {isDecrypted && recordData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Record Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type</label>
                      <p className="text-gray-900">{recordData.recordType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <p className="text-gray-900">{new Date(recordData.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <p className="text-gray-900">{recordData.category}</p>
                    </div>
                    {recordData.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="text-gray-900">{recordData.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Provider Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Provider Name</label>
                      <p className="text-gray-900">{recordData.providerName || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Provider Address</label>
                      <p className="text-gray-900 font-mono text-sm break-all">
                        {recordData.providerAddress || record.providerAddress}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <EyeOff className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Record Encrypted</p>
                      <p className="text-xs text-yellow-700">
                        This record is encrypted and requires decryption to view details.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blockchain Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Blockchain Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-blue-900">Record ID</label>
                    <p className="text-blue-700 font-mono break-all">{record.id}</p>
                  </div>
                  <div>
                    <label className="font-medium text-blue-900">Record Hash</label>
                    <p className="text-blue-700 font-mono break-all">{record.recordHash}</p>
                  </div>
                  <div>
                    <label className="font-medium text-blue-900">Patient Address</label>
                    <p className="text-blue-700 font-mono break-all">{record.patientAddress}</p>
                  </div>
                  <div>
                    <label className="font-medium text-blue-900">Timestamp</label>
                    <p className="text-blue-700">{formatDate(record.timestamp)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

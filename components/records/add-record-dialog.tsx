"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Upload, Shield, FileText, AlertCircle } from "lucide-react"
import { web3Service } from "@/lib/web3"
import { useAuth } from "@/hooks/use-auth"

interface AddRecordDialogProps {
  onRecordAdded: () => void
}

export function AddRecordDialog({ onRecordAdded }: AddRecordDialogProps) {
  const { authData } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    recordType: "",
    title: "",
    description: "",
    providerName: "",
    providerAddress: "",
    date: "",
    category: "",
    attachments: [] as File[],
  })

  const recordTypes = [
    "Blood Test",
    "X-Ray",
    "MRI",
    "CT Scan",
    "Prescription",
    "Vaccination",
    "Surgery Report",
    "Lab Results",
    "Consultation Notes",
    "Discharge Summary",
  ]

  const categories = [
    "Laboratory",
    "Imaging",
    "Medication",
    "Surgery",
    "Consultation",
    "Emergency",
    "Preventive Care",
    "Chronic Care",
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }))
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authData?.address) return

    setIsSubmitting(true)
    setError("")

    try {
      // Validate required fields
      if (!formData.recordType || !formData.title || !formData.date) {
        throw new Error("Please fill in all required fields")
      }

      // Create record data
      const recordData = {
        ...formData,
        timestamp: new Date(formData.date).getTime(),
        patientAddress: authData.address,
        attachmentHashes: [], // In production, upload files to IPFS and store hashes
      }

      // Encrypt sensitive data
      const encryptedData = web3Service.encryptData(JSON.stringify(recordData), authData.address)

      // Store record on blockchain (simulated)
      const recordId = await web3Service.storeHealthRecord({
        patientAddress: authData.address,
        recordHash: `0x${Math.random().toString(16).substr(2, 40)}`, // Simulated hash
        recordType: formData.recordType,
        providerAddress: formData.providerAddress || authData.address,
        encrypted: true,
      })

      // Store encrypted data locally (in production, this would be on IPFS)
      const existingData = JSON.parse(localStorage.getItem("recordData") || "{}")
      existingData[recordId] = encryptedData
      localStorage.setItem("recordData", JSON.stringify(existingData))

      // Reset form and close dialog
      setFormData({
        recordType: "",
        title: "",
        description: "",
        providerName: "",
        providerAddress: "",
        date: "",
        category: "",
        attachments: [],
      })
      setOpen(false)
      onRecordAdded()
    } catch (error: any) {
      setError(error.message || "Failed to add record")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add New Health Record
          </DialogTitle>
          <DialogDescription>
            Create a new encrypted health record that will be securely stored on the blockchain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recordType">Record Type *</Label>
              <Select value={formData.recordType} onValueChange={(value) => handleInputChange("recordType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Annual Blood Work Results"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Additional details about this record..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Healthcare Provider</Label>
              <Input
                id="providerName"
                value={formData.providerName}
                onChange={(e) => handleInputChange("providerName", e.target.value)}
                placeholder="e.g., Dr. Smith, City Hospital"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerAddress">Provider Wallet Address</Label>
              <Input
                id="providerAddress"
                value={formData.providerAddress}
                onChange={(e) => handleInputChange("providerAddress", e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Attachments
              </CardTitle>
              <CardDescription className="text-xs">
                Upload medical documents, images, or reports (files will be encrypted)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="cursor-pointer"
                />
                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Security Notice</p>
                  <p className="text-xs text-blue-700">
                    This record will be encrypted with your wallet address and stored securely on the blockchain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Record...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

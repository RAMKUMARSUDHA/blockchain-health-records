"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Shield,
  Activity,
  Eye,
  Share2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Hospital,
  Heart,
  Brain,
  Pill,
  Search,
  Filter,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { web3Service, type HealthRecord } from "@/lib/web3"
import { securityService } from "@/lib/security"
import { AddRecordDialog } from "@/components/records/add-record-dialog"
import { RecordDetailDialog } from "@/components/records/record-detail-dialog"
import { SecurityDashboard } from "@/components/security/security-dashboard"

interface PatientProfile {
  address: string
  name: string
  dateOfBirth: string
  bloodType: string
  allergies: string[]
  emergencyContact: string
  lastUpdated: number
}

interface AccessLog {
  id: string
  timestamp: number
  action: string
  recordId?: string
  providerAddress?: string
  ipAddress: string
}

export function PatientDashboard() {
  const { authData } = useAuth()
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [showRecordDetail, setShowRecordDetail] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [securityScore, setSecurityScore] = useState(0)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState<PatientProfile | null>(null)
  const [newAllergy, setNewAllergy] = useState("")

  useEffect(() => {
    loadDashboardData()
  }, [authData])

  useEffect(() => {
    filterRecords()
  }, [records, searchTerm, filterType])

  const loadDashboardData = async () => {
    if (!authData?.address) return

    setIsLoading(true)
    try {
      // Load security service data
      securityService.loadStoredData()

      // Calculate security score
      const score = securityService.calculateSecurityScore(authData.address)
      setSecurityScore(score)

      const storedProfile = localStorage.getItem("patientProfile")
      let mockProfile: PatientProfile

      if (storedProfile) {
        mockProfile = JSON.parse(storedProfile)
      } else {
        mockProfile = {
          address: authData.address,
          name: "Ramkumar S",
          dateOfBirth: "2006-05-15",
          bloodType: "A+",
          allergies: ["Penicillin", "Shellfish"],
          emergencyContact: "+91 9876543210",
          lastUpdated: Date.now() - 86400000, // 1 day ago
        }
      }
      setProfile(mockProfile)

      // Load health records
      await refreshRecords()

      // Load access logs (mock data)
      const mockLogs: AccessLog[] = [
        {
          id: "log_1",
          timestamp: Date.now() - 3600000, // 1 hour ago
          action: "Record Viewed",
          recordId: "record_1",
          providerAddress: "0x5678...efgh",
          ipAddress: "192.168.1.100",
        },
        {
          id: "log_2",
          timestamp: Date.now() - 86400000, // 1 day ago
          action: "Profile Updated",
          ipAddress: "192.168.1.100",
        },
        {
          id: "log_3",
          timestamp: Date.now() - 172800000, // 2 days ago
          action: "New Record Added",
          recordId: "record_1",
          providerAddress: "0x5678...efgh",
          ipAddress: "10.0.0.50",
        },
      ]
      setAccessLogs(mockLogs)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRecords = async () => {
    if (!authData?.address) return

    const patientRecords = await web3Service.getPatientRecords(authData.address)

    // Add some mock records if none exist
    if (patientRecords.length === 0) {
      const mockRecords: HealthRecord[] = [
        {
          id: "record_1",
          patientAddress: authData.address,
          recordHash: "0x1234...abcd",
          timestamp: Date.now() - 172800000, // 2 days ago
          recordType: "Blood Test",
          providerAddress: "0x5678...efgh",
          encrypted: true,
        },
        {
          id: "record_2",
          patientAddress: authData.address,
          recordHash: "0x5678...efgh",
          timestamp: Date.now() - 604800000, // 1 week ago
          recordType: "X-Ray",
          providerAddress: "0x9abc...ijkl",
          encrypted: true,
        },
        {
          id: "record_3",
          patientAddress: authData.address,
          recordHash: "0x9abc...ijkl",
          timestamp: Date.now() - 1209600000, // 2 weeks ago
          recordType: "Prescription",
          providerAddress: "0xdef0...mnop",
          encrypted: true,
        },
      ]

      // Store mock records
      localStorage.setItem("healthRecords", JSON.stringify(mockRecords))
      setRecords(mockRecords)
    } else {
      setRecords(patientRecords)
    }
  }

  const filterRecords = () => {
    let filtered = records

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((record) => record.recordType.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((record) => record.recordType === filterType)
    }

    setFilteredRecords(filtered)
  }

  const handleRecordAdded = () => {
    refreshRecords()
    // Recalculate security score after adding record
    if (authData?.address) {
      const score = securityService.calculateSecurityScore(authData.address)
      setSecurityScore(score)
    }
  }

  const handleViewRecord = (record: HealthRecord) => {
    setSelectedRecord(record)
    setShowRecordDetail(true)
  }

  const handleEditProfile = () => {
    setEditedProfile({ ...profile! })
    setIsEditingProfile(true)
  }

  const handleSaveProfile = () => {
    if (editedProfile) {
      setProfile({ ...editedProfile, lastUpdated: Date.now() })
      // Store updated profile in localStorage for persistence
      localStorage.setItem("patientProfile", JSON.stringify({ ...editedProfile, lastUpdated: Date.now() }))
      setIsEditingProfile(false)
      setEditedProfile(null)

      // Log the profile update
      const newLog: AccessLog = {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        action: "Profile Updated",
        ipAddress: "192.168.1.100",
      }
      setAccessLogs((prev) => [newLog, ...prev])
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setEditedProfile(null)
    setNewAllergy("")
  }

  const handleAddAllergy = () => {
    if (newAllergy.trim() && editedProfile) {
      setEditedProfile({
        ...editedProfile,
        allergies: [...editedProfile.allergies, newAllergy.trim()],
      })
      setNewAllergy("")
    }
  }

  const handleRemoveAllergy = (index: number) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        allergies: editedProfile.allergies.filter((_, i) => i !== index),
      })
    }
  }

  const getRecordIcon = (recordType: string) => {
    switch (recordType.toLowerCase()) {
      case "blood test":
        return <Heart className="h-4 w-4" />
      case "x-ray":
        return <Activity className="h-4 w-4" />
      case "prescription":
        return <Pill className="h-4 w-4" />
      case "mri":
      case "ct scan":
        return <Brain className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    return "Just now"
  }

  const getUniqueRecordTypes = () => {
    const types = [...new Set(records.map((record) => record.recordType))]
    return types
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
              {profile?.name
                .split(" ")
                .map((n) => n[0])
                .join("") || "JD"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.name || "Patient"}</h1>
            <p className="text-gray-600">Manage your secure health records</p>
          </div>
        </div>
        <AddRecordDialog onRecordAdded={handleRecordAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p
                  className={`text-2xl font-bold ${securityScore >= 90 ? "text-green-600" : securityScore >= 70 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {securityScore}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Access</p>
                <p className="text-2xl font-bold text-orange-600">{accessLogs.length}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Providers</p>
                <p className="text-2xl font-bold text-purple-600">3</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Hospital className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="records">Health Records</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Health Records</CardTitle>
                  <CardDescription>Secure, encrypted records stored on the blockchain</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {getUniqueRecordTypes().map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm || filterType !== "all" ? "No records match your filters" : "No health records found"}
                    </p>
                    {!searchTerm && filterType === "all" && (
                      <p className="text-sm text-gray-500 mt-2">Add your first health record to get started</p>
                    )}
                  </div>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">{getRecordIcon(record.recordType)}</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{record.recordType}</h3>
                          <p className="text-sm text-gray-600">{formatDate(record.timestamp)}</p>
                        </div>
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
                        <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Profile</CardTitle>
                  <CardDescription>Your personal health information</CardDescription>
                </div>
                <div className="flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </>
                  ) : (
                    <Button onClick={handleEditProfile}>Edit Profile</Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  {isEditingProfile ? (
                    <Input
                      value={editedProfile?.name || ""}
                      onChange={(e) => setEditedProfile((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile?.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  {isEditingProfile ? (
                    <Input
                      type="date"
                      value={editedProfile?.dateOfBirth || ""}
                      onChange={(e) =>
                        setEditedProfile((prev) => (prev ? { ...prev, dateOfBirth: e.target.value } : null))
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile?.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Blood Type</label>
                  {isEditingProfile ? (
                    <Select
                      value={editedProfile?.bloodType || ""}
                      onValueChange={(value) =>
                        setEditedProfile((prev) => (prev ? { ...prev, bloodType: value } : null))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-gray-900">{profile?.bloodType}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Emergency Contact</label>
                  {isEditingProfile ? (
                    <Input
                      value={editedProfile?.emergencyContact || ""}
                      onChange={(e) =>
                        setEditedProfile((prev) => (prev ? { ...prev, emergencyContact: e.target.value } : null))
                      }
                      className="mt-1"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile?.emergencyContact}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Known Allergies</label>
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(isEditingProfile ? editedProfile?.allergies : profile?.allergies)?.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {allergy}
                          {isEditingProfile && (
                            <button
                              onClick={() => handleRemoveAllergy(index)}
                              className="ml-1 hover:bg-red-700 rounded-full p-0.5"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditingProfile && (
                      <div className="flex gap-2">
                        <Input
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          placeholder="Add new allergy"
                          onKeyPress={(e) => e.key === "Enter" && handleAddAllergy()}
                        />
                        <Button type="button" onClick={handleAddAllergy} disabled={!newAllergy.trim()}>
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Wallet Address</label>
                  <p className="mt-1 text-gray-900 font-mono text-sm">{profile?.address}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-gray-600 text-sm">
                    {profile?.lastUpdated ? formatDate(profile.lastUpdated) : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Track access to your health records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-600">
                        {getTimeAgo(log.timestamp)} • IP: {log.ipAddress}
                      </p>
                    </div>
                    <Badge variant="outline">{formatDate(log.timestamp)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Security Features</CardTitle>
              <CardDescription>Enhanced security controls and blockchain verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Data Integrity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Hash Verification</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Blockchain Immutability</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Access Control</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Smart Contract Permissions</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Time-based Access</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Detail Dialog */}
      <RecordDetailDialog record={selectedRecord} open={showRecordDetail} onOpenChange={setShowRecordDetail} />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Key,
  Users,
  Activity,
  Lock,
  Unlock,
  Clock,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { securityService, type SecurityAudit, type AccessPermission } from "@/lib/security"

export function SecurityDashboard() {
  const { authData } = useAuth()
  const [securityScore, setSecurityScore] = useState(0)
  const [auditLogs, setAuditLogs] = useState<SecurityAudit[]>([])
  const [permissions, setPermissions] = useState<AccessPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authData?.address) {
      loadSecurityData()
    }
  }, [authData])

  const loadSecurityData = async () => {
    if (!authData?.address) return

    setIsLoading(true)
    try {
      // Load stored security data
      securityService.loadStoredData()

      // Calculate security score
      const score = securityService.calculateSecurityScore(authData.address)
      setSecurityScore(score)

      // Get audit logs
      const logs = securityService.getSecurityAuditLogs(authData.address, 20)
      setAuditLogs(logs)

      // Get permissions
      const userPermissions = securityService.getUserPermissions(authData.address)
      setPermissions(userPermissions)
    } catch (error) {
      console.error("Error loading security data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokePermission = async (permissionId: string) => {
    if (!authData?.address) return

    try {
      await securityService.revokeAccess(authData.address, permissionId)
      loadSecurityData() // Refresh data
    } catch (error) {
      console.error("Error revoking permission:", error)
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

  const getRiskBadgeVariant = (riskLevel: SecurityAudit["riskLevel"]) => {
    switch (riskLevel) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getSecurityScoreDescription = (score: number) => {
    if (score >= 90) return "Excellent security posture"
    if (score >= 70) return "Good security with room for improvement"
    if (score >= 50) return "Moderate security - action recommended"
    return "Poor security - immediate action required"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Security Score
          </CardTitle>
          <CardDescription>Overall security assessment of your health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-3xl font-bold ${getSecurityScoreColor(securityScore)}`}>{securityScore}%</div>
              <p className="text-sm text-gray-600">{getSecurityScoreDescription(securityScore)}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                {securityScore >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : securityScore >= 70 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {securityScore >= 90 ? "Secure" : securityScore >= 70 ? "Moderate" : "At Risk"}
                </span>
              </div>
            </div>
          </div>
          <Progress value={securityScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {securityScore < 70 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your security score is below recommended levels. Review your recent activity and consider revoking
            unnecessary access permissions.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="permissions">Access Permissions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Audit Logs
              </CardTitle>
              <CardDescription>Recent security events and access attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No security events recorded</p>
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            log.success ? (log.riskLevel === "high" ? "bg-yellow-100" : "bg-green-100") : "bg-red-100"
                          }`}
                        >
                          {log.success ? (
                            log.riskLevel === "high" ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{log.action}</p>
                          <p className="text-sm text-gray-600">
                            {getTimeAgo(log.timestamp)} • IP: {log.ipAddress}
                          </p>
                          {log.details && <p className="text-xs text-gray-500 mt-1">{log.details}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(log.riskLevel)}>{log.riskLevel.toUpperCase()}</Badge>
                        <Badge variant={log.success ? "secondary" : "destructive"}>
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Access Permissions
              </CardTitle>
              <CardDescription>Manage who has access to your health records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active permissions</p>
                    <p className="text-sm text-gray-500 mt-2">You haven't granted access to any healthcare providers</p>
                  </div>
                ) : (
                  permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Key className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {permission.resourceType === "full_access" ? "Full Access" : permission.resourceType}
                          </p>
                          <p className="text-sm text-gray-600">
                            To: {permission.granteeAddress.slice(0, 6)}...{permission.granteeAddress.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-500">Permissions: {permission.permissions.join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <p className="text-gray-600">Expires</p>
                          <p className="text-gray-900">{formatDate(permission.expiresAt)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokePermission(permission.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Encryption Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Encryption</p>
                    <p className="text-sm text-gray-600">AES-256 encryption enabled</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Key Rotation</p>
                    <p className="text-sm text-gray-600">Automatic key rotation</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Privacy Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Anonymous Mode</p>
                    <p className="text-sm text-gray-600">Hide personal identifiers</p>
                  </div>
                  <Badge variant="outline">
                    <Unlock className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Access Notifications</p>
                    <p className="text-sm text-gray-600">Alert on record access</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Logout</p>
                    <p className="text-sm text-gray-600">24 hours of inactivity</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Multi-Device Access</p>
                    <p className="text-sm text-gray-600">Allow multiple sessions</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Blockchain Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Smart Contract Verification</p>
                    <p className="text-sm text-gray-600">Verify contract integrity</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transaction Signing</p>
                    <p className="text-sm text-gray-600">Require signature for changes</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

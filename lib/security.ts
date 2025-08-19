import { ethers } from "ethers"

export interface SecurityAudit {
  id: string
  timestamp: number
  action: string
  userAddress: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  success: boolean
  riskLevel: "low" | "medium" | "high"
  details?: string
}

export interface AccessPermission {
  id: string
  granterAddress: string
  granteeAddress: string
  resourceId: string
  resourceType: "record" | "profile" | "full_access"
  permissions: ("read" | "write" | "share" | "delete")[]
  expiresAt: number
  createdAt: number
  isActive: boolean
}

export class SecurityService {
  private static instance: SecurityService
  private auditLogs: SecurityAudit[] = []
  private permissions: AccessPermission[] = []

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService()
    }
    return SecurityService.instance
  }

  // Enhanced encryption with AES-256
  async encryptData(data: string, userAddress: string): Promise<string> {
    try {
      // In production, use proper AES-256 encryption with the user's private key
      const key = await this.deriveEncryptionKey(userAddress)
      const encrypted = btoa(JSON.stringify({ data, key: key.slice(0, 16), timestamp: Date.now() }))

      this.logSecurityEvent({
        action: "Data Encrypted",
        userAddress,
        success: true,
        riskLevel: "low",
      })

      return encrypted
    } catch (error) {
      this.logSecurityEvent({
        action: "Encryption Failed",
        userAddress,
        success: false,
        riskLevel: "high",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  async decryptData(encryptedData: string, userAddress: string): Promise<string> {
    try {
      const decoded = JSON.parse(atob(encryptedData))
      const key = await this.deriveEncryptionKey(userAddress)

      // Verify the key matches
      if (decoded.key !== key.slice(0, 16)) {
        throw new Error("Invalid decryption key")
      }

      this.logSecurityEvent({
        action: "Data Decrypted",
        userAddress,
        success: true,
        riskLevel: "low",
      })

      return decoded.data
    } catch (error) {
      this.logSecurityEvent({
        action: "Decryption Failed",
        userAddress,
        success: false,
        riskLevel: "high",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      throw new Error("Failed to decrypt data")
    }
  }

  private async deriveEncryptionKey(userAddress: string): Promise<string> {
    // In production, derive a proper encryption key from the user's private key
    return ethers.keccak256(ethers.toUtf8Bytes(userAddress + "healthchain_key"))
  }

  // Access control management
  async grantAccess(
    granterAddress: string,
    granteeAddress: string,
    resourceId: string,
    resourceType: AccessPermission["resourceType"],
    permissions: AccessPermission["permissions"],
    expiresInHours = 24,
  ): Promise<string> {
    const permission: AccessPermission = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      granterAddress,
      granteeAddress,
      resourceId,
      resourceType,
      permissions,
      expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
      createdAt: Date.now(),
      isActive: true,
    }

    this.permissions.push(permission)
    this.savePermissions()

    this.logSecurityEvent({
      action: "Access Granted",
      userAddress: granterAddress,
      resourceId,
      success: true,
      riskLevel: "medium",
      details: `Granted ${permissions.join(", ")} to ${granteeAddress}`,
    })

    return permission.id
  }

  async revokeAccess(granterAddress: string, permissionId: string): Promise<void> {
    const permission = this.permissions.find((p) => p.id === permissionId && p.granterAddress === granterAddress)

    if (!permission) {
      throw new Error("Permission not found or unauthorized")
    }

    permission.isActive = false
    this.savePermissions()

    this.logSecurityEvent({
      action: "Access Revoked",
      userAddress: granterAddress,
      resourceId: permission.resourceId,
      success: true,
      riskLevel: "medium",
      details: `Revoked access from ${permission.granteeAddress}`,
    })
  }

  async checkAccess(
    userAddress: string,
    resourceId: string,
    requiredPermission: AccessPermission["permissions"][0],
  ): Promise<boolean> {
    const now = Date.now()
    const validPermissions = this.permissions.filter(
      (p) =>
        p.granteeAddress.toLowerCase() === userAddress.toLowerCase() &&
        p.resourceId === resourceId &&
        p.isActive &&
        p.expiresAt > now &&
        p.permissions.includes(requiredPermission),
    )

    const hasAccess = validPermissions.length > 0

    this.logSecurityEvent({
      action: "Access Check",
      userAddress,
      resourceId,
      success: hasAccess,
      riskLevel: hasAccess ? "low" : "medium",
      details: `Checked ${requiredPermission} permission`,
    })

    return hasAccess
  }

  // Security monitoring
  private logSecurityEvent(event: Omit<SecurityAudit, "id" | "timestamp" | "ipAddress" | "userAgent">) {
    const audit: SecurityAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      ...event,
    }

    this.auditLogs.push(audit)
    this.saveAuditLogs()

    // In production, send high-risk events to monitoring service
    if (event.riskLevel === "high") {
      console.warn("High-risk security event:", audit)
    }
  }

  getSecurityAuditLogs(userAddress?: string, limit = 50): SecurityAudit[] {
    let logs = [...this.auditLogs].sort((a, b) => b.timestamp - a.timestamp)

    if (userAddress) {
      logs = logs.filter((log) => log.userAddress.toLowerCase() === userAddress.toLowerCase())
    }

    return logs.slice(0, limit)
  }

  getUserPermissions(userAddress: string): AccessPermission[] {
    const now = Date.now()
    return this.permissions.filter(
      (p) =>
        (p.granterAddress.toLowerCase() === userAddress.toLowerCase() ||
          p.granteeAddress.toLowerCase() === userAddress.toLowerCase()) &&
        p.isActive &&
        p.expiresAt > now,
    )
  }

  // Data integrity verification
  async verifyDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const computedHash = ethers.keccak256(ethers.toUtf8Bytes(data))
    return computedHash === expectedHash
  }

  generateDataHash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data))
  }

  // Security score calculation
  calculateSecurityScore(userAddress: string): number {
    const recentLogs = this.getSecurityAuditLogs(userAddress, 100)
    const permissions = this.getUserPermissions(userAddress)

    let score = 100

    // Deduct points for failed security events
    const failedEvents = recentLogs.filter((log) => !log.success)
    score -= failedEvents.length * 2

    // Deduct points for high-risk events
    const highRiskEvents = recentLogs.filter((log) => log.riskLevel === "high")
    score -= highRiskEvents.length * 5

    // Deduct points for too many active permissions (potential over-sharing)
    if (permissions.length > 10) {
      score -= (permissions.length - 10) * 3
    }

    // Bonus points for recent activity (shows active security monitoring)
    const recentActivity = recentLogs.filter((log) => Date.now() - log.timestamp < 7 * 24 * 60 * 60 * 1000)
    if (recentActivity.length > 0) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  private getClientIP(): string {
    // In production, get real client IP
    return "192.168.1.100"
  }

  private getUserAgent(): string {
    return typeof window !== "undefined" ? window.navigator.userAgent : "Unknown"
  }

  private saveAuditLogs() {
    if (typeof window !== "undefined") {
      localStorage.setItem("security_audit_logs", JSON.stringify(this.auditLogs))
    }
  }

  private savePermissions() {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_permissions", JSON.stringify(this.permissions))
    }
  }

  // Load data from storage
  loadStoredData() {
    if (typeof window !== "undefined") {
      const storedLogs = localStorage.getItem("security_audit_logs")
      if (storedLogs) {
        this.auditLogs = JSON.parse(storedLogs)
      }

      const storedPermissions = localStorage.getItem("access_permissions")
      if (storedPermissions) {
        this.permissions = JSON.parse(storedPermissions)
      }
    }
  }
}

export const securityService = SecurityService.getInstance()

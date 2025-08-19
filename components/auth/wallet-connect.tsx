"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Wallet, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { useWeb3 } from "@/hooks/use-web3"

interface WalletConnectProps {
  onAuthenticated: (account: string) => void
}

export function WalletConnect({ onAuthenticated }: WalletConnectProps) {
  const { isConnected, account, isLoading, connect, disconnect } = useWeb3()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string>("")
  const [authStep, setAuthStep] = useState<"connect" | "sign" | "complete">("connect")

  useEffect(() => {
    if (isConnected && account && authStep === "connect") {
      handleAuthentication()
    }
  }, [isConnected, account, authStep])

  const handleAuthentication = async () => {
    if (!account) return

    setIsAuthenticating(true)
    setAuthError("")
    setAuthStep("sign")

    try {
      // Import web3Service here to avoid SSR issues
      const { web3Service } = await import("@/lib/web3")

      // Create authentication message
      const timestamp = Date.now()
      const message = `Welcome to HealthChain!\n\nSign this message to authenticate your identity.\n\nTimestamp: ${timestamp}\nAddress: ${account}`

      // Request signature for authentication
      const signature = await web3Service.signMessage(message)

      if (!signature) {
        throw new Error("Authentication signature required")
      }

      // Store authentication data
      const authData = {
        address: account,
        signature,
        timestamp,
        authenticated: true,
      }

      localStorage.setItem("healthchain_auth", JSON.stringify(authData))

      setAuthStep("complete")
      setTimeout(() => {
        onAuthenticated(account)
      }, 1000)
    } catch (error: any) {
      setAuthError(error.message || "Authentication failed")
      setAuthStep("connect")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleConnect = async () => {
    setAuthError("")
    await connect()
  }

  const handleDisconnect = () => {
    disconnect()
    localStorage.removeItem("healthchain_auth")
    setAuthStep("connect")
    setAuthError("")
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-blue-200">
          <CardHeader className="text-center">
            <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
            <CardDescription>Connect your MetaMask wallet to access your secure health records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect MetaMask
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>Don't have MetaMask?</p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Download MetaMask
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-green-200">
        <CardHeader className="text-center">
          <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            {authStep === "complete" ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Shield className="h-8 w-8 text-green-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {authStep === "sign" && "Authenticate Identity"}
            {authStep === "complete" && "Authentication Complete"}
            {authStep === "connect" && "Wallet Connected"}
          </CardTitle>
          <CardDescription>
            {authStep === "sign" && "Please sign the message to verify your identity"}
            {authStep === "complete" && "Welcome to HealthChain! Redirecting..."}
            {authStep === "connect" && "Ready to authenticate"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Connected Address:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {account.slice(0, 6)}...{account.slice(-4)}
            </Badge>
          </div>

          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {authStep === "sign" && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>Check your MetaMask wallet to sign the authentication message.</AlertDescription>
            </Alert>
          )}

          {isAuthenticating ? (
            <Button disabled className="w-full" size="lg">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {authStep === "sign" ? "Waiting for signature..." : "Authenticating..."}
            </Button>
          ) : authStep === "complete" ? (
            <Button disabled className="w-full bg-green-600" size="lg">
              <CheckCircle className="mr-2 h-4 w-4" />
              Authentication Successful
            </Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleAuthentication} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <Shield className="mr-2 h-4 w-4" />
                Authenticate Identity
              </Button>
              <Button onClick={handleDisconnect} variant="outline" className="w-full bg-transparent" size="sm">
                Disconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

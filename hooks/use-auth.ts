"use client"

import { useState, useEffect, useCallback } from "react"
import { useWeb3 } from "./use-web3"

interface AuthData {
  address: string
  signature: string
  timestamp: number
  authenticated: boolean
}

export function useAuth() {
  const { isConnected, account } = useWeb3()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthentication = useCallback(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem("healthchain_auth")
    if (stored && isConnected && account) {
      try {
        const data: AuthData = JSON.parse(stored)

        // Check if auth is for current account and not expired (24 hours)
        const isValid =
          data.address.toLowerCase() === account.toLowerCase() &&
          data.authenticated &&
          Date.now() - data.timestamp < 24 * 60 * 60 * 1000

        if (isValid) {
          setAuthData(data)
          setIsAuthenticated(true)
        } else {
          // Clear invalid auth
          localStorage.removeItem("healthchain_auth")
          setAuthData(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error parsing auth data:", error)
        localStorage.removeItem("healthchain_auth")
        setAuthData(null)
        setIsAuthenticated(false)
      }
    } else {
      setAuthData(null)
      setIsAuthenticated(false)
    }

    setIsLoading(false)
  }, [isConnected, account])

  const logout = useCallback(() => {
    localStorage.removeItem("healthchain_auth")
    setAuthData(null)
    setIsAuthenticated(false)
  }, [])

  const authenticate = useCallback(
    (address: string) => {
      setIsAuthenticated(true)
      // Auth data will be set by checkAuthentication
      checkAuthentication()
    },
    [checkAuthentication],
  )

  useEffect(() => {
    checkAuthentication()
  }, [checkAuthentication])

  // Clear auth if wallet disconnected
  useEffect(() => {
    if (!isConnected) {
      setAuthData(null)
      setIsAuthenticated(false)
    }
  }, [isConnected])

  return {
    isAuthenticated,
    authData,
    isLoading,
    authenticate,
    logout,
  }
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { web3Service } from "@/lib/web3"

export function useWeb3() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const checkConnection = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
          await web3Service.initialize()
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }, [])

  const connect = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      setIsLoading(true)
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setIsConnected(true)
        setAccount(accounts[0])
        await web3Service.initialize()
      } catch (error) {
        console.error("Error connecting wallet:", error)
      } finally {
        setIsLoading(false)
      }
    } else {
      alert("Please install MetaMask to use this application")
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAccount("")
  }

  useEffect(() => {
    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          setAccount(accounts[0])
        }
      })

      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [checkConnection])

  return {
    isConnected,
    account,
    isLoading,
    connect,
    disconnect,
  }
}

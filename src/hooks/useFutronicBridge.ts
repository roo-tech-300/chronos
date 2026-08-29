/**
 * Custom React Hook for connecting to and monitoring the local Futronic Node Bridge
 */

import { useState, useEffect, useCallback } from 'react'
import { futronicBridge } from '../services/futronicBridge'
import { getHardwareBridgePort, setHardwareBridgePort } from '../config/hardware'
import type { ScannerHardwareStatus, BiometricCapturePayload } from '../types/terminal'

export function useFutronicBridge() {
  const [isBridgeOnline, setIsBridgeOnline] = useState<boolean>(false)
  const [bridgeVersion, setBridgeVersion] = useState<string | undefined>()
  const [scannerStatus, setScannerStatus] = useState<ScannerHardwareStatus>({
    isConnected: false,
    deviceModel: 'Futronic FS80H (Checking...)',
  })
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [lastCapture, setLastCapture] = useState<BiometricCapturePayload | null>(null)
  const [currentPort, setCurrentPort] = useState<number>(() => getHardwareBridgePort())
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([])

  useEffect(() => {
    const unsubLog = futronicBridge.onLogEvent((text) => {
      const now = new Date().toLocaleTimeString()
      let type: 'info' | 'success' | 'warn' | 'error' = 'info'
      if (text.includes('active') && !text.includes('not active')) type = 'success'
      else if (text.includes('Found the device plugged in')) type = 'success'
      else if (text.includes('No device plugged') || text.includes('not active')) type = 'warn'

      setLogs((prev) => [
        { id: Math.random().toString(36).substring(2, 9), time: now, text, type },
        ...prev.slice(0, 24),
      ])
    })
    return () => unsubLog()
  }, [])

  const checkStatus = useCallback(async () => {
    setIsChecking(true)
    try {
      const health = await futronicBridge.checkBridgeHealth()
      setIsBridgeOnline(health.isOnline)
      setBridgeVersion(health.appName)

      if (health.isOnline) {
        const scanner = await futronicBridge.getScannerStatus()
        setScannerStatus(scanner)
      } else {
        setScannerStatus({
          isConnected: false,
          deviceModel: 'Futronic FS80H (Bridge Offline)',
          error: health.error,
        })
      }
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const poll = async () => {
      if (!isMounted) return
      await checkStatus()
    }
    const timer = setInterval(poll, 4000)
    // Initial fetch scheduled asynchronously
    const initial = setTimeout(poll, 50)
    return () => {
      isMounted = false
      clearInterval(timer)
      clearTimeout(initial)
    }
  }, [checkStatus])

  useEffect(() => {
    futronicBridge.connectWebSocket()

    const unsubScan = futronicBridge.onScanEvent((payload) => {
      setLastCapture(payload)
    })

    const unsubStatus = futronicBridge.onStatusEvent((status) => {
      setScannerStatus(status)
      setIsBridgeOnline(true)
    })

    return () => {
      unsubScan()
      unsubStatus()
      futronicBridge.disconnectWebSocket()
    }
  }, [])

  const triggerCapture = useCallback(async () => {
    setIsCapturing(true)
    try {
      const res = await futronicBridge.triggerCapture()
      if (res.success && res.payload) {
        setLastCapture(res.payload)
        return res.payload
      }
      return null
    } finally {
      setIsCapturing(false)
    }
  }, [])

  const updatePort = useCallback(
    (newPort: number) => {
      setHardwareBridgePort(newPort)
      setCurrentPort(newPort)
      futronicBridge.disconnectWebSocket()
      checkStatus()
      futronicBridge.connectWebSocket()
    },
    [checkStatus]
  )

  return {
    isBridgeOnline,
    bridgeVersion,
    scannerStatus,
    isChecking,
    isCapturing,
    lastCapture,
    currentPort,
    logs,
    checkStatus,
    triggerCapture,
    updatePort,
  }
}

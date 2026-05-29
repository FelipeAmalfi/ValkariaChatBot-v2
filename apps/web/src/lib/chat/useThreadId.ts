'use client'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useThreadId() {
  const [threadId, setThreadId] = useState<string>('')

  useEffect(() => {
    const stored = localStorage.getItem('valkaria:threadId')
    if (stored) {
      setThreadId(stored)
    } else {
      const newId = uuidv4()
      localStorage.setItem('valkaria:threadId', newId)
      setThreadId(newId)
    }
  }, [])

  return threadId
}

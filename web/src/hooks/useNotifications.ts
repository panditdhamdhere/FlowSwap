import { useState, useEffect, useCallback } from 'react'

export interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
  canRequest: boolean
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  data?: any
}

class NotificationService {
  private static instance: NotificationService
  private permissionState: NotificationPermission = {
    granted: false,
    denied: false,
    default: true,
    canRequest: false
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private constructor() {
    this.updatePermissionState()
  }

  private updatePermissionState(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.permissionState = {
        granted: false,
        denied: false,
        default: false,
        canRequest: false
      }
      return
    }

    const permission = Notification.permission
    this.permissionState = {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
      canRequest: permission === 'default'
    }
  }

  getPermission(): NotificationPermission {
    this.updatePermissionState()
    return { ...this.permissionState }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    this.updatePermissionState()
    return permission === 'granted'
  }

  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.permissionState.granted) {
      console.warn('Notification permission not granted')
      return null
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser')
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data
      })

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  async showPriceAlert(coin: string, price: number, change: number, isAbove: boolean): Promise<Notification | null> {
    const direction = isAbove ? 'above' : 'below'
    const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`
    
    return this.showNotification({
      title: `🚨 ${coin.toUpperCase()} Price Alert`,
      body: `${coin.toUpperCase()} is now ${direction} your target price at $${price.toFixed(4)} (${changeText} change)`,
      tag: `price-alert-${coin}`,
      requireInteraction: true,
      data: {
        type: 'price-alert',
        coin,
        price,
        change,
        isAbove
      }
    })
  }

  async showTradeNotification(type: 'swap' | 'liquidity' | 'order', details: any): Promise<Notification | null> {
    let title = ''
    let body = ''

    switch (type) {
      case 'swap':
        title = '✅ Swap Completed'
        body = `${details.from} → ${details.to}: ${details.amountIn} → ${details.amountOut}`
        break
      case 'liquidity':
        title = '💧 Liquidity Action'
        body = `${details.action} liquidity: ${details.amount} tokens`
        break
      case 'order':
        title = '📋 Order Executed'
        body = `${details.side} order filled: ${details.amount} ${details.pair}`
        break
    }

    return this.showNotification({
      title,
      body,
      tag: `trade-${type}-${Date.now()}`,
      data: {
        type: 'trade',
        tradeType: type,
        details
      }
    })
  }

  async showSystemNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<Notification | null> {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }

    return this.showNotification({
      title: `${icons[type]} ${title}`,
      body: message,
      tag: `system-${type}`,
      data: {
        type: 'system',
        notificationType: type
      }
    })
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true,
    canRequest: false
  })
  const [isSupported, setIsSupported] = useState(false)

  const notificationService = NotificationService.getInstance()

  useEffect(() => {
    const checkSupport = () => {
      const supported = typeof window !== 'undefined' && 'Notification' in window
      setIsSupported(supported)
      
      if (supported) {
        setPermission(notificationService.getPermission())
      }
    }

    checkSupport()
  }, [notificationService])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission()
    setPermission(notificationService.getPermission())
    return granted
  }, [notificationService])

  const showNotification = useCallback(async (options: NotificationOptions): Promise<Notification | null> => {
    return notificationService.showNotification(options)
  }, [notificationService])

  const showPriceAlert = useCallback(async (coin: string, price: number, change: number, isAbove: boolean): Promise<Notification | null> => {
    return notificationService.showPriceAlert(coin, price, change, isAbove)
  }, [notificationService])

  const showTradeNotification = useCallback(async (type: 'swap' | 'liquidity' | 'order', details: any): Promise<Notification | null> => {
    return notificationService.showTradeNotification(type, details)
  }, [notificationService])

  const showSystemNotification = useCallback(async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<Notification | null> => {
    return notificationService.showSystemNotification(title, message, type)
  }, [notificationService])

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showPriceAlert,
    showTradeNotification,
    showSystemNotification
  }
}

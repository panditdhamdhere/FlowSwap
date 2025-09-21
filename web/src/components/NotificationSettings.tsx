import { motion } from 'framer-motion'
import { useNotifications } from '../hooks/useNotifications'

interface NotificationSettingsProps {
  className?: string
}

export default function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { 
    permission, 
    isSupported, 
    requestPermission, 
    showNotification 
  } = useNotifications()

  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission()
      if (granted) {
        // Show a test notification
        await showNotification({
          title: '🔔 Notifications Enabled!',
          body: 'You\'ll now receive price alerts and trade notifications.',
          requireInteraction: true
        })
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  const handleTestNotification = async () => {
    await showNotification({
      title: '🧪 Test Notification',
      body: 'This is a test notification from FlowSwap DEX',
      requireInteraction: false
    })
  }

  if (!isSupported) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Notifications not supported in this browser
          </span>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🔔 Notification Settings
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          permission.granted 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
            : permission.denied
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
        }`}>
          {permission.granted ? 'Enabled' : permission.denied ? 'Denied' : 'Not Set'}
        </div>
      </div>

      <div className="space-y-4">
        {permission.granted ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>You'll receive notifications for:</span>
            </div>
            <ul className="ml-7 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Price alerts when targets are reached</li>
              <li>• Trade confirmations and status updates</li>
              <li>• Liquidity pool notifications</li>
              <li>• System updates and maintenance alerts</li>
            </ul>
            
            <button
              onClick={handleTestNotification}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              Test Notification
            </button>
          </div>
        ) : permission.denied ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-red-600 dark:text-red-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Notifications are blocked</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
              To enable notifications, please allow them in your browser settings and refresh the page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Enable notifications to get real-time alerts</span>
            </div>
            
            <button
              onClick={handleRequestPermission}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enable Notifications
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Notifications help you stay informed about price movements and trading activity. 
            You can manage these settings anytime in your browser.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

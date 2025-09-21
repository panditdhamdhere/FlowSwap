import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceAlerts, type PriceAlert } from '../hooks/usePriceAlerts';
import { usePriceHistory } from '../hooks/usePriceHistory';
import { useNotifications } from '../hooks/useNotifications';
import { useMarketData } from '../hooks/useMarketData';

interface PriceAlertsProps {
  className?: string;
}

const PriceAlerts: React.FC<PriceAlertsProps> = ({ className = '' }) => {
  const {
    alerts,
    createAlert,
    deleteAlert,
    toggleAlert,
    checkAlerts,
    activeAlertsCount,
    triggeredAlertsCount,
    clearTriggeredAlerts,
    resetAlert,
  } = usePriceAlerts();

  const { currentPrice } = usePriceHistory('AtoB');
  const { showPriceAlert, permission } = useNotifications();
  const { getFlowData, getUSDCData } = useMarketData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    pair: 'AtoB' as 'AtoB' | 'BtoA',
    targetPrice: '',
    condition: 'above' as 'above' | 'below',
    message: '',
  });

  // Check for triggered alerts every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const triggered = checkAlerts();
      if (triggered.length > 0 && permission.granted) {
        // Show enhanced notifications for each triggered alert
        for (const alert of triggered) {
          const coin = alert.pair === 'AtoB' ? 'FLOW' : 'USDC';
          const marketData = alert.pair === 'AtoB' ? getFlowData() : getUSDCData();
          const priceChange = marketData?.price_change_percentage_24h || 0;
          
          await showPriceAlert(
            coin,
            Number(alert.targetPrice),
            priceChange,
            alert.condition === 'above'
          );
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkAlerts, permission.granted, showPriceAlert, getFlowData, getUSDCData]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCreateAlert = () => {
    const targetPrice = parseFloat(newAlert.targetPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) return;

    const message = newAlert.message.trim() || 
      `${newAlert.pair} price ${newAlert.condition} ${targetPrice}`;

    createAlert({
      pair: newAlert.pair,
      targetPrice,
      condition: newAlert.condition,
      isActive: true,
      message,
    });

    setNewAlert({
      pair: 'AtoB',
      targetPrice: '',
      condition: 'above',
      message: '',
    });
    setShowCreateForm(false);
  };

  const formatAlertPrice = (price: number) => {
    return price.toFixed(6);
  };

  const getAlertStatus = (alert: PriceAlert) => {
    if (alert.triggeredAt) return 'triggered';
    if (!alert.isActive) return 'inactive';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'triggered': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'active': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'inactive': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'triggered': return '🔔';
      case 'active': return '⏰';
      case 'inactive': return '⏸️';
      default: return '⏸️';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Price Alerts</h3>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active: <span className="font-semibold text-blue-600 dark:text-blue-400">{activeAlertsCount}</span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Triggered: <span className="font-semibold text-green-600 dark:text-green-400">{triggeredAlertsCount}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {triggeredAlertsCount > 0 && (
              <button
                onClick={clearTriggeredAlerts}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Triggered
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              + New Alert
            </button>
          </div>
        </div>
      </div>

      {/* Create Alert Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trading Pair
                  </label>
                  <select
                    value={newAlert.pair}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, pair: e.target.value as 'AtoB' | 'BtoA' }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AtoB">FLOW/USDC</option>
                    <option value="BtoA">USDC/FLOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition
                  </label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value as 'above' | 'below' }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Price
                </label>
                <input
                  type="number"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, targetPrice: e.target.value }))}
                  placeholder="0.000000"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current price: {formatAlertPrice(currentPrice)} {newAlert.pair === 'AtoB' ? 'USDC' : 'FLOW'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message (Optional)
                </label>
                <input
                  type="text"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter custom alert message..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateAlert}
                  disabled={!newAlert.targetPrice || parseFloat(newAlert.targetPrice) <= 0}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Alert
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No price alerts set</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Create your first alert to get notified of price movements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const status = getAlertStatus(alert);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-lg border ${getStatusColor(status)} border-current`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(status)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {alert.pair === 'AtoB' ? 'FLOW/USDC' : 'USDC/FLOW'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {alert.condition} {formatAlertPrice(alert.targetPrice)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {new Date(alert.createdAt).toLocaleString()}
                          {alert.triggeredAt && (
                            <span className="ml-2">
                              • Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {status === 'triggered' && (
                        <button
                          onClick={() => resetAlert(alert.id)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                      {status !== 'triggered' && (
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            alert.isActive 
                              ? 'bg-gray-500 text-white hover:bg-gray-600' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {alert.isActive ? 'Pause' : 'Resume'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAlerts;

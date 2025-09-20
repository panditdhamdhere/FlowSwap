import { useState, useEffect, useCallback } from 'react';
import { usePriceHistory } from './usePriceHistory';

export interface PriceAlert {
  id: string;
  pair: 'AtoB' | 'BtoA';
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
  message: string;
}

const STORAGE_KEY = 'flowswap_price_alerts';

export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const { currentPrice } = usePriceHistory('AtoB'); // Default to AtoB for now

  // Load alerts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedAlerts = JSON.parse(stored);
        setAlerts(parsedAlerts);
      }
    } catch (error) {
      console.error('Error loading price alerts:', error);
    }
  }, []);

  // Save alerts to localStorage whenever alerts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving price alerts:', error);
    }
  }, [alerts]);

  // Create a new price alert
  const createAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggeredAt'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    
    setAlerts(prev => [...prev, newAlert]);
    return newAlert.id;
  }, []);

  // Update an existing alert
  const updateAlert = useCallback((id: string, updates: Partial<PriceAlert>) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ));
  }, []);

  // Delete an alert
  const deleteAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Toggle alert active status
  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  }, []);

  // Check for triggered alerts
  const checkAlerts = useCallback(() => {
    if (currentPrice <= 0) return [];

    const triggeredAlerts: PriceAlert[] = [];
    
    alerts.forEach(alert => {
      if (!alert.isActive || alert.triggeredAt) return;
      
      const shouldTrigger = alert.condition === 'above' 
        ? currentPrice >= alert.targetPrice 
        : currentPrice <= alert.targetPrice;
      
      if (shouldTrigger) {
        const updatedAlert = { ...alert, triggeredAt: Date.now() };
        triggeredAlerts.push(updatedAlert);
        
        // Update the alert in state
        setAlerts(prev => prev.map(a => 
          a.id === alert.id ? updatedAlert : a
        ));
      }
    });
    
    return triggeredAlerts;
  }, [alerts, currentPrice]);

  // Get active alerts count
  const activeAlertsCount = alerts.filter(alert => alert.isActive && !alert.triggeredAt).length;

  // Get triggered alerts count
  const triggeredAlertsCount = alerts.filter(alert => alert.triggeredAt).length;

  // Clear all triggered alerts
  const clearTriggeredAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.triggeredAt));
  }, []);

  // Reset a triggered alert (make it active again)
  const resetAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, triggeredAt: undefined } : alert
    ));
  }, []);

  return {
    alerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    checkAlerts,
    activeAlertsCount,
    triggeredAlertsCount,
    clearTriggeredAlerts,
    resetAlert,
  };
};

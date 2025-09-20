import { useState, useEffect, useCallback } from 'react';
import { usePriceHistory } from './usePriceHistory';

export interface LimitOrder {
  id: string;
  pairId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  filledAt?: number;
  cancelledAt?: number;
  expiresAt?: number;
  filledAmount?: number;
  averagePrice?: number;
  userAddress: string;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  orders: number;
}

const STORAGE_KEY = 'flowswap_limit_orders';

export const useLimitOrders = () => {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<string>('flow-usdc');
  const { currentPrice } = usePriceHistory('AtoB');

  // Load orders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error('Error loading limit orders:', error);
    }
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving limit orders:', error);
    }
  }, [orders]);

  // Create a new limit order
  const createOrder = useCallback((orderData: Omit<LimitOrder, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: LimitOrder = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    
    setOrders(prev => [...prev, newOrder]);
    return newOrder.id;
  }, []);

  // Cancel an order
  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId && order.status === 'pending'
        ? { ...order, status: 'cancelled', cancelledAt: Date.now() }
        : order
    ));
  }, []);

  // Update order status
  const updateOrderStatus = useCallback((orderId: string, status: LimitOrder['status'], updates?: Partial<LimitOrder>) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status, ...updates };
        if (status === 'filled') {
          updatedOrder.filledAt = Date.now();
        }
        return updatedOrder;
      }
      return order;
    }));
  }, []);

  // Get orders for a specific pair
  const getOrdersForPair = useCallback((pairId: string) => {
    return orders.filter(order => order.pairId === pairId);
  }, [orders]);

  // Get pending orders
  const getPendingOrders = useCallback(() => {
    return orders.filter(order => order.status === 'pending');
  }, [orders]);

  // Get filled orders
  const getFilledOrders = useCallback(() => {
    return orders.filter(order => order.status === 'filled');
  }, [orders]);

  // Get cancelled orders
  const getCancelledOrders = useCallback(() => {
    return orders.filter(order => order.status === 'cancelled');
  }, [orders]);

  // Build order book for a pair
  const getOrderBook = useCallback((pairId: string) => {
    const pairOrders = getOrdersForPair(pairId).filter(order => order.status === 'pending');
    
    // Group by price
    const buyOrders: { [price: number]: OrderBookEntry } = {};
    const sellOrders: { [price: number]: OrderBookEntry } = {};
    
    pairOrders.forEach(order => {
      const target = order.type === 'buy' ? buyOrders : sellOrders;
      
      if (!target[order.price]) {
        target[order.price] = {
          price: order.price,
          amount: 0,
          total: 0,
          orders: 0,
        };
      }
      
      target[order.price].amount += order.amount;
      target[order.price].total += order.amount * order.price;
      target[order.price].orders += 1;
    });
    
    // Convert to arrays and sort
    const buyBook = Object.values(buyOrders)
      .sort((a, b) => b.price - a.price) // Highest price first
      .slice(0, 10); // Top 10 levels
    
    const sellBook = Object.values(sellOrders)
      .sort((a, b) => a.price - b.price) // Lowest price first
      .slice(0, 10); // Top 10 levels
    
    return { buyBook, sellBook };
  }, [getOrdersForPair]);

  // Check for order fills (simplified matching engine)
  const checkOrderFills = useCallback(() => {
    if (currentPrice <= 0) return [];
    
    const filledOrders: LimitOrder[] = [];
    const now = Date.now();
    
    orders.forEach(order => {
      if (order.status !== 'pending') return;
      
      // Check if order has expired
      if (order.expiresAt && now > order.expiresAt) {
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, status: 'expired' } : o
        ));
        return;
      }
      
      // Check if order should be filled
      const shouldFill = order.type === 'buy' 
        ? currentPrice <= order.price  // Buy order: market price is at or below our limit
        : currentPrice >= order.price; // Sell order: market price is at or above our limit
      
      if (shouldFill) {
        const filledOrder = {
          ...order,
          status: 'filled' as const,
          filledAt: now,
          filledAmount: order.amount,
          averagePrice: currentPrice,
        };
        
        filledOrders.push(filledOrder);
        
        setOrders(prev => prev.map(o => 
          o.id === order.id ? filledOrder : o
        ));
      }
    });
    
    return filledOrders;
  }, [orders, currentPrice]);

  // Get order statistics
  const getOrderStats = useCallback(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const filled = orders.filter(o => o.status === 'filled').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const expired = orders.filter(o => o.status === 'expired').length;
    
    const totalVolume = orders
      .filter(o => o.status === 'filled')
      .reduce((sum, o) => sum + (o.filledAmount || 0), 0);
    
    const totalValue = orders
      .filter(o => o.status === 'filled')
      .reduce((sum, o) => sum + (o.filledAmount || 0) * (o.averagePrice || 0), 0);
    
    return {
      pending,
      filled,
      cancelled,
      expired,
      totalVolume,
      totalValue,
    };
  }, [orders]);

  // Auto-check for fills every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const filled = checkOrderFills();
      if (filled.length > 0) {
        // Show notification for filled orders
        if (Notification.permission === 'granted') {
          filled.forEach(order => {
            new Notification('Order Filled!', {
              body: `${order.type.toUpperCase()} order filled at ${order.averagePrice?.toFixed(6)}`,
              icon: '/favicon.ico',
            });
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkOrderFills]);

  return {
    orders,
    selectedPairId,
    setSelectedPairId,
    createOrder,
    cancelOrder,
    updateOrderStatus,
    getOrdersForPair,
    getPendingOrders,
    getFilledOrders,
    getCancelledOrders,
    getOrderBook,
    checkOrderFills,
    getOrderStats,
  };
};

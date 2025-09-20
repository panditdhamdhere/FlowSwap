import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLimitOrders, type LimitOrder } from '../hooks/useLimitOrders';
import { useTradingPairs } from '../hooks/useTradingPairs';
import { usePriceHistory } from '../hooks/usePriceHistory';

interface LimitOrdersProps {
  className?: string;
}

const LimitOrders: React.FC<LimitOrdersProps> = ({ className = '' }) => {
  const {
    selectedPairId,
    createOrder,
    cancelOrder,
    getOrdersForPair,
    getOrderBook,
    getOrderStats,
  } = useLimitOrders();

  const { selectedPair, formatPairName } = useTradingPairs();
  const { currentPrice } = usePriceHistory('AtoB');
  
  const [activeTab, setActiveTab] = useState<'create' | 'orders' | 'orderbook'>('create');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [newOrder, setNewOrder] = useState({
    amount: '',
    price: '',
    expiresIn: '24', // hours
  });

  const stats = getOrderStats();
  const pairOrders = getOrdersForPair(selectedPairId);
  const orderBook = getOrderBook(selectedPairId);

  const handleCreateOrder = () => {
    const amount = parseFloat(newOrder.amount);
    const price = parseFloat(newOrder.price);
    const expiresIn = parseInt(newOrder.expiresIn);
    
    if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) return;

    const expiresAt = Date.now() + (expiresIn * 60 * 60 * 1000); // Convert hours to milliseconds

    createOrder({
      pairId: selectedPairId,
      type: orderType,
      amount,
      price,
      expiresAt,
      userAddress: 'current-user', // In real app, get from wallet
    });

    setNewOrder({ amount: '', price: '', expiresIn: '24' });
  };

  const formatOrderStatus = (status: LimitOrder['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' },
      filled: { label: 'Filled', color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
      cancelled: { label: 'Cancelled', color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20' },
      expired: { label: 'Expired', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
    };
    return statusConfig[status];
  };

  const formatOrderType = (type: LimitOrder['type']) => {
    return type === 'buy' ? 'Buy' : 'Sell';
  };


  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Limit Orders</h3>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Pending: <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Filled: <span className="font-semibold text-green-600 dark:text-green-400">{stats.filled}</span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Volume: <span className="font-semibold text-blue-600 dark:text-blue-400">${stats.totalValue.toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'create', label: 'Create Order' },
            { key: 'orders', label: 'My Orders' },
            { key: 'orderbook', label: 'Order Book' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Type
                </label>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setOrderType('buy')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      orderType === 'buy'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setOrderType('sell')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      orderType === 'sell'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ({orderType === 'buy' ? selectedPair?.tokenB.symbol : selectedPair?.tokenA.symbol})
                </label>
                <input
                  type="number"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.0"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limit Price ({orderType === 'buy' ? selectedPair?.tokenA.symbol : selectedPair?.tokenB.symbol})
                </label>
                <input
                  type="number"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.0"
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current price: {currentPrice.toFixed(6)} {selectedPair?.tokenB.symbol}
                </p>
              </div>

              {/* Expires In */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expires In (hours)
                </label>
                <select
                  value={newOrder.expiresIn}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, expiresIn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">1 week</option>
                </select>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateOrder}
                disabled={!newOrder.amount || !newOrder.price || parseFloat(newOrder.amount) <= 0 || parseFloat(newOrder.price) <= 0}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  orderType === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                Create {orderType === 'buy' ? 'Buy' : 'Sell'} Order
              </button>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {pairOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Create your first limit order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pairOrders.map((order) => {
                    const statusConfig = formatOrderStatus(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${statusConfig.color} border-current`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              order.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {order.type === 'buy' ? 'B' : 'S'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {formatOrderType(order.type)} {order.amount.toFixed(6)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  @ {order.price.toFixed(6)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {formatPairName(selectedPair || { tokenA: { symbol: 'FLOW' }, tokenB: { symbol: 'USDC' } } as any)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Created: {new Date(order.createdAt).toLocaleString()}
                                {order.filledAt && (
                                  <span className="ml-2">
                                    • Filled: {new Date(order.filledAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {order.status === 'pending' && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orderbook' && (
            <motion.div
              key="orderbook"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Buy Orders */}
                <div>
                  <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">Buy Orders</h4>
                  <div className="space-y-1">
                    {orderBook.buyBook.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No buy orders
                      </div>
                    ) : (
                      orderBook.buyBook.map((entry, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-green-600 dark:text-green-400">{entry.price.toFixed(6)}</span>
                          <span className="text-gray-600 dark:text-gray-400">{entry.amount.toFixed(4)}</span>
                          <span className="text-gray-500 dark:text-gray-500">{entry.orders}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sell Orders */}
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Sell Orders</h4>
                  <div className="space-y-1">
                    {orderBook.sellBook.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No sell orders
                      </div>
                    ) : (
                      orderBook.sellBook.map((entry, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-red-600 dark:text-red-400">{entry.price.toFixed(6)}</span>
                          <span className="text-gray-600 dark:text-gray-400">{entry.amount.toFixed(4)}</span>
                          <span className="text-gray-500 dark:text-gray-500">{entry.orders}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LimitOrders;

import { useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import { Toaster, toast } from 'react-hot-toast'
import { useAppStore } from './store'

function Connect() {
  const userAddress = useAppStore((s) => s.userAddress)
  const setUserAddress = useAppStore((s) => s.setUserAddress)

  useEffect(() => {
    return fcl.currentUser().subscribe((user) => setUserAddress(user?.addr ?? null))
  }, [setUserAddress])

  return (
    <div className="flex items-center gap-2">
      {userAddress ? (
        <>
          <span className="px-2 py-1 rounded bg-green-100 text-green-700">{userAddress}</span>
          <button className="px-3 py-1 rounded bg-gray-200" onClick={() => fcl.unauthenticate()}>Disconnect</button>
        </>
      ) : (
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => fcl.logIn()}>Connect</button>
      )}
    </div>
  )
}

export default function App() {
  const pairId = useAppStore((s) => s.pairId)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Flow DEX</h1>
          <Connect />
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded border bg-white">
            <h2 className="font-medium mb-2">Add Liquidity ({pairId})</h2>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast('Send add liquidity tx...') }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border p-2 rounded" placeholder="Amount TEST1" />
                <input className="border p-2 rounded" placeholder="Amount TEST2" />
              </div>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit">Supply</button>
            </form>
          </div>

          <div className="p-4 rounded border bg-white">
            <h2 className="font-medium mb-2">Swap</h2>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast('Send swap tx...') }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border p-2 rounded" placeholder="Amount In" />
                <input className="border p-2 rounded" placeholder="Min Out" />
              </div>
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" type="submit">Swap</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, X } from 'lucide-react'
import Header from '../components/Header'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/accountsApi'

export default function AccountManager({ setFirstLoginNoAccounts }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newAccount, setNewAccount] = useState({ account_name: '', account_type: '', currency: 'INR' })
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({ account_name: '', account_type: '', currency: 'INR' })
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [balanceEditId, setBalanceEditId] = useState(null)
  const [newBalance, setNewBalance] = useState('')
  const navigate = useNavigate()
  const isFirstLogin = localStorage.getItem('first_login_no_accounts') === 'true'

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAccounts()
      setAccounts(data || [])
    } catch (e) {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newAccount.account_name.trim()) {
      setError('Account name is required')
      return
    }
    try {
      const created = await createAccount(newAccount)
      setAccounts([created, ...accounts])
      setNewAccount({ account_name: '', account_type: '', currency: 'INR' })
      // If first login, clear flag and notify parent, then redirect to dashboard
      if (isFirstLogin) {
        localStorage.removeItem('first_login_no_accounts')
        if (setFirstLoginNoAccounts) setFirstLoginNoAccounts(false)
        setTimeout(() => navigate('/dashboard'), 500)
      }
    } catch (e) {
      setError('Failed to create account')
    }
  }

  const startEdit = (acc) => {
    setEditingId(acc.id)
    setEditingData({
      account_name: acc.account_name || '',
      account_type: acc.account_type || '',
      currency: acc.currency || 'INR',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingData({ account_name: '', account_type: '', currency: 'INR' })
  }

  const saveEdit = async (id) => {
    try {
      const updated = await updateAccount(id, editingData)
      setAccounts(accounts.map(a => (a.id === id ? updated : a)))
      cancelEdit()
    } catch (e) {
      setError('Failed to update account')
    }
  }

  const removeAccount = async (id) => {
    if (!confirm('Delete this account?')) return
    try {
      await deleteAccount(id)
      setAccounts(accounts.filter(a => a.id !== id))
    } catch (e) {
      setError('Failed to delete account')
    }
  }

  const openBalanceModal = (acc) => {
    setBalanceEditId(acc.id)
    setNewBalance(acc.balance || '')
    setShowBalanceModal(true)
  }

  const closeBalanceModal = () => {
    setShowBalanceModal(false)
    setBalanceEditId(null)
    setNewBalance('')
  }

  const saveBalance = async () => {
    if (!newBalance || isNaN(newBalance)) {
      setError('Please enter a valid balance')
      return
    }
    try {
      const updated = await updateAccount(balanceEditId, { balance: parseFloat(newBalance) })
      setAccounts(accounts.map(a => (a.id === balanceEditId ? updated : a)))
      closeBalanceModal()
    } catch (e) {
      setError('Failed to update balance')
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Header title="Account Manager" subtitle="View, create, edit, and delete your accounts." />

      {isFirstLogin && accounts.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4">
          <p className="font-semibold">Welcome! You don't have any accounts yet.</p>
          <p>Create your first account below to start tracking transactions.</p>
        </div>
      )}

      {/* Create New Account */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New Account</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Account Name</label>
            <input
              type="text"
              value={newAccount.account_name}
              onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Account Type</label>
            <input
              type="text"
              value={newAccount.account_type}
              onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Savings, Checking, Credit Card"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Currency</label>
            <input
              type="text"
              value={newAccount.currency}
              onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">Add Account</button>
        </form>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Accounts</h3>
        {loading ? (
          <div>Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="text-gray-500">No accounts found.</div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {editingId === acc.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <input
                      type="text"
                      value={editingData.account_name}
                      onChange={(e) => setEditingData({ ...editingData, account_name: e.target.value })}
                      className="border rounded-md px-3 py-2"
                    />
                    <input
                      type="text"
                      value={editingData.account_type}
                      onChange={(e) => setEditingData({ ...editingData, account_type: e.target.value })}
                      className="border rounded-md px-3 py-2"
                    />
                    <input
                      type="text"
                      value={editingData.currency}
                      onChange={(e) => setEditingData({ ...editingData, currency: e.target.value })}
                      className="border rounded-md px-3 py-2"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{acc.account_name}</p>
                    <p className="text-sm text-gray-600">Type: {acc.account_type || '—'} • Currency: {acc.currency || 'INR'}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">₹{(acc.balance || 0).toLocaleString('en-IN')}</p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  {editingId === acc.id ? (
                    <>
                      <button onClick={() => saveEdit(acc.id)} className="bg-green-600 text-white px-3 py-2 rounded-md">Save</button>
                      <button onClick={cancelEdit} className="bg-gray-300 text-gray-800 px-3 py-2 rounded-md">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openBalanceModal(acc)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center gap-1">
                        <DollarSign size={16} /> Balance
                      </button>
                      <button onClick={() => startEdit(acc)} className="bg-blue-600 text-white px-3 py-2 rounded-md">Edit</button>
                      <button onClick={() => removeAccount(acc.id)} className="bg-red-600 text-white px-3 py-2 rounded-md">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Balance Update Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign size={28} className="text-green-600" />
                Update Balance
              </h2>
              <button
                onClick={closeBalanceModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Enter the current account balance</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={saveBalance}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Update Balance
              </button>
              <button
                onClick={closeBalanceModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

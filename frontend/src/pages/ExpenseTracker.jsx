import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Plus, Trash2, Pencil, Upload, X } from "lucide-react";
import Header from "../components/Header";
import {
  fetchTransactions,
  deleteTransaction,
  fetchCategories,
  fetchAccounts,
  uploadCsv,
} from "../api/transactionsApi";
import TransactionModal from "../components/TransactionModal";

const categoryIcons = {
  Food: "🍔",
  Travel: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Utilities: "⚡",
  Income: "💰",
  Salary: "💵",
  Groceries: "🛒",
  Fuel: "⛽",
  Healthcare: "🏥",
  Education: "📚",
  Sports: "⚽",
  Dining: "🍽️",
  Movies: "🎭",
  Other: "💳",
};

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [selectedUploadAccount, setSelectedUploadAccount] = useState("");
  
  // Month/Year selector state
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catsData, accsData] = await Promise.all([
          fetchCategories(),
          fetchAccounts(),
        ]);
        setCategories(catsData || []);
        setAccounts(accsData || []);
      } catch (err) {
        console.error("Failed to load categories/accounts:", err);
      }
    };
    loadMetadata();
  }, []);

  const loadTransactions = async () => {
    const data = await fetchTransactions();
    setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "Other";
  };

  const getAccountName = (accountId) => {
    const acc = accounts.find((a) => a.id === accountId);
    return acc?.account_name || "Unknown";
  };

  const getIconForCategory = (categoryId) => {
    const categoryName = getCategoryName(categoryId);
    return categoryIcons[categoryName] || categoryIcons.Other;
  };

  const categoryOptions = useMemo(() => {
    const unique = new Set(
      transactions
        .map((tx) => tx.category_id)
        .filter(Boolean)
    );
    return ["All", ...Array.from(unique).sort()];
  }, [transactions]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory =
      selectedCategory === "All" || tx.category_id === Number(selectedCategory);
    const matchesSearch = (tx.description || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    // Filter by month and year
    let matchesMonth = true;
    if (tx.transaction_date) {
      const txDate = new Date(tx.transaction_date);
      const txMonth = txDate.getMonth() + 1;
      const txYear = txDate.getFullYear();
      matchesMonth = txMonth === month && txYear === year;
    }
    
    return matchesCategory && matchesSearch && matchesMonth;
  });

  const totalSpent = filteredTransactions
    .filter((t) => t.transaction_type !== "income")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const average = filteredTransactions.length
    ? Math.round(totalSpent / filteredTransactions.length)
    : 0;

  const highest = filteredTransactions.length
    ? Math.max(...filteredTransactions.map((t) => Number(t.amount || 0)))
    : 0;

  const handleDelete = async (id) => {
    await deleteTransaction(id);
    if (editing?.id === id) setEditing(undefined);
    loadTransactions();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadMessage({ type: "error", text: "Please select a file" });
      return;
    }

    if (!selectedUploadAccount) {
      setUploadMessage({ type: "error", text: "Please select an account" });
      return;
    }

    try {
      setUploading(true);
      setUploadMessage(null);
      await uploadCsv(uploadFile, selectedUploadAccount);
      setUploadMessage({ type: "success", text: "Transactions uploaded successfully!" });
      setUploadFile(null);
      setSelectedUploadAccount("");
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadMessage(null);
        loadTransactions();
      }, 1500);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadMessage({
        type: "error",
        text: error.response?.data?.detail || error.response?.data?.error || "Failed to upload transactions. Please check the file format and account selection.",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const displayAmount = (tx) => {
    const num = Math.abs(Number(tx.amount || 0));
    const formatted = num.toLocaleString("en-IN");
    const sign = tx.transaction_type === "income" ? "+" : "-";
    return `${sign}₹${formatted}`;
  };

  const iconFor = (tx) => tx.icon || categoryIcon[tx.category] || categoryIcon.Other;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Header title="Expense Tracker" subtitle="Track and manage all your transactions" />

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4">
          <p className="text-sm font-semibold text-gray-700">
            Viewing {new Date(year, month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(year, m - 1).toLocaleDateString("en-IN", { month: "long" })}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Search / Filters / Quick Add */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map((catId) => {
                const label = catId === "All" ? "All" : getCategoryName(catId);
                return (
                  <option key={catId} value={catId}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Upload size={18} />
              Upload File
            </button>
            <button
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-gray-600 text-sm">Transactions</p>
            <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Spent</p>
            <p className="text-2xl font-bold text-red-600">₹{totalSpent.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Average</p>
            <p className="text-2xl font-bold text-gray-800">₹{average.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Highest</p>
            <p className="text-2xl font-bold text-gray-800">₹{highest.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Upload Transactions</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadMessage(null);
                  setSelectedUploadAccount("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* File Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 font-medium">
                    {uploadFile ? uploadFile.name : "Click to select or drag a CSV file"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV format with columns: date, description, amount, type
                  </p>
                </label>
              </div>
            </div>

            {/* Account Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Account *
              </label>
              <select
                value={selectedUploadAccount}
                onChange={(e) => setSelectedUploadAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose an account --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} ({account.account_type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                All transactions in this file will be added to the selected account
              </p>
            </div>

            {/* Message */}
            {uploadMessage && (
              <div
                className={`mb-6 p-3 rounded-lg text-sm font-medium ${
                  uploadMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {uploadMessage.text}
              </div>
            )}

            {/* Help Text */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-200">
              <p className="font-semibold mb-2">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Column 1: <code>date</code> (YYYY-MM-DD)</li>
                <li>Column 2: <code>description</code> (transaction description)</li>
                <li>Column 3: <code>amount</code> (numeric value)</li>
                <li>Column 4: <code>type</code> (expense or income)</li>
              </ul>
              <p className="mt-3 text-xs">
                <a
                  href="/sample_transactions.csv"
                  download
                  className="underline hover:text-blue-900 font-semibold"
                >
                  Download sample CSV file →
                </a>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || !selectedUploadAccount || uploading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadMessage(null);
                  setSelectedUploadAccount("");
                }}
                disabled={uploading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <TransactionModal
        isOpen={editing !== undefined}
        onClose={() => setEditing(undefined)}
        mode={editing ? "edit" : "create"}
        initialData={editing}
        onSave={loadTransactions}
      />

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-3xl">{getIconForCategory(transaction.category_id)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 truncate">
                  {transaction.description || "Transaction"}
                </h4>
                <p className="text-sm text-gray-500">
                  {formatDate(transaction.transaction_date)}
                  {transaction.transaction_date && " • "}
                  {formatTime(transaction.transaction_date)}
                  {transaction.account_id && (
                    <>
                      {" • "}
                      <span className="text-gray-600 font-medium">{getAccountName(transaction.account_id)}</span>
                    </>
                  )}
                </p>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {getCategoryName(transaction.category_id)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p
                className={`text-lg font-bold ${
                  transaction.transaction_type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {displayAmount(transaction)}
              </p>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                onClick={() => setEditing(transaction)}
                aria-label="Edit"
              >
                <Pencil size={18} />
              </button>
              <button
                className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                onClick={() => handleDelete(transaction.id)}
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">No transactions found</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Plus, Trash2, Pencil } from "lucide-react";
import Header from "../components/Header";
import {
  fetchTransactions,
  deleteTransaction,
  fetchCategories,
  fetchAccounts,
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
    return matchesCategory && matchesSearch;
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

          <div className="flex justify-end">
            <button
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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

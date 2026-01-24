import { useEffect, useState } from "react";
import { fetchTransactions } from "../api/transactionsApi";

// Displays the fetched transactions using the styled UI from RecentTransactions(1).jsx
const RecentTransactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions().then(setTransactions);
  }, []);

  const formatAmount = (tx) => {
    const num = Number(tx.amount);
    if (Number.isNaN(num)) return tx.amount ?? "";
    const formatted = Math.abs(num).toLocaleString("en-IN");
    const sign = tx.transaction_type === "income" ? "+" : "-";
    return `${sign}₹${formatted}`;
  };

  const getIcon = (tx) => tx.icon || "💳";
  const getName = (tx) => tx.name || tx.description || "Transaction";
  const getDate = (tx) => tx.date || "";

  return (
    <div className="space-y-3">
      {transactions.slice(0, 5).map((transaction) => {
        const amountDisplay = formatAmount(transaction);
        const isIncome = transaction.transaction_type === "income";

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl">{getIcon(transaction)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{getName(transaction)}</p>
                {getDate(transaction) && (
                  <p className="text-xs text-gray-500">{getDate(transaction)}</p>
                )}
              </div>
            </div>
            <p className={`font-semibold text-sm ${isIncome ? "text-green-600" : "text-red-600"}`}>
              {amountDisplay}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default RecentTransactions;

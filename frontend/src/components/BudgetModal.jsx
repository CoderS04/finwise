import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function BudgetModal({
  isOpen,
  onClose,
  categoryName,
  categoryIcon,
  categoryId,
  suggestedBudget,
  currentBudget,
  onSave,
  month,
  year,
}) {
  const [budget, setBudget] = useState(suggestedBudget || currentBudget || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBudget(suggestedBudget || currentBudget || "");
  }, [suggestedBudget, currentBudget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(parseFloat(budget));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {categoryIcon && <span className="text-3xl">{categoryIcon}</span>}
              <h2 className="text-xl font-bold text-gray-800">
                Set Budget for {categoryName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {suggestedBudget && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-semibold mb-1">
                  💡 Recommended Budget
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{suggestedBudget.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Based on your last 3 months spending pattern
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount for {new Date(year, month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter budget amount"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || !budget}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Budget"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

import { X } from "lucide-react";
import TransactionForm from "./TransactionForm";

export default function TransactionModal({
  isOpen,
  onClose,
  mode = "create",
  initialData = null,
  onSave,
}) {
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === "edit" ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <TransactionForm
              mode={mode}
              initialData={initialData}
              onSave={() => {
                onSave?.();
                onClose();
              }}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
}

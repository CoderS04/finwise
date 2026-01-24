import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import Header from "../components/Header";
import BudgetModal from "../components/BudgetModal";
import {
  getBudgets,
  getBudgetInsights,
  createBudget,
  deleteBudget,
  getBudgetSuggestion,
} from "../api/budgetsApi";
import { fetchCategories } from "../api/transactionsApi";

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

const BudgetPlanner = () => {
  const [budgets, setBudgets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [suggestedBudget, setSuggestedBudget] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  
  // Current month/year
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsData, insightsData, categoriesData] = await Promise.all([
        getBudgets(month, year),
        getBudgetInsights(month, year),
        fetchCategories(),
      ]);
      
      setBudgets(budgetsData || []);
      setInsights(insightsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error("Failed to load budget data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "Overall Budget";
  };

  const getCategoryIcon = (categoryId) => {
    const name = getCategoryName(categoryId);
    return categoryIcons[name] || categoryIcons.Other;
  };

  const handleAddBudget = async (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    setSelectedCategory(category);
    setEditingBudget(null);
    
    // Fetch suggestion
    try {
      const suggestion = await getBudgetSuggestion(categoryId);
      setSuggestedBudget(suggestion.suggested_budget);
    } catch {
      setSuggestedBudget(null);
    }
    
    setShowModal(true);
  };

  const handleEditBudget = async (budget) => {
    const category = budget.category_id 
      ? categories.find((c) => c.id === budget.category_id)
      : { id: null, name: "Monthly Budget" };
    
    setSelectedCategory(category);
    setEditingBudget(budget);
    
    // Fetch suggestion only for category budgets
    if (budget.category_id) {
      try {
        const suggestion = await getBudgetSuggestion(budget.category_id);
        setSuggestedBudget(suggestion.suggested_budget);
      } catch {
        setSuggestedBudget(null);
      }
    } else {
      setSuggestedBudget(null);
    }
    
    setShowModal(true);
  };

  const handleSaveBudget = async (budgetAmount) => {
    try {
      await createBudget({
        category_id: selectedCategory.id || null,
        monthly_limit: budgetAmount,
        month,
        year,
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save budget");
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      await deleteBudget(budgetId);
      loadData();
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    if (percentage < 100) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPercentage = (spent, budget) => {
    return Math.round((spent / budget) * 100);
  };

  // Merge budgets with insights
  const budgetData = budgets.map((budget) => {
    const insight = insights.find((i) => i.category_id === budget.category_id);
    return {
      ...budget,
      spent: insight?.spent || 0,
      status: insight?.status || "good",
      health_score: insight?.health_score || 100,
      warning: insight?.warning || null,
    };
  });

  // Separate monthly budget from category budgets
  const monthlyBudget = budgetData.find((b) => b.category_id === null);
  const categoryBudgets = budgetData.filter((b) => b.category_id !== null);

  // Calculate totals based on whether monthly budget is set
  let totalBudget, totalSpent;
  
  if (monthlyBudget) {
    // If monthly budget exists, use it as total budget and total spent from insights
    totalBudget = monthlyBudget.monthly_limit;
    // Total spent is either from monthly budget insight or sum of category spending
    totalSpent = monthlyBudget.spent || 
      categoryBudgets.reduce((sum, b) => sum + b.spent, 0);
  } else {
    // If no monthly budget, sum category budgets and spending
    totalBudget = categoryBudgets.reduce((sum, b) => sum + b.monthly_limit, 0);
    totalSpent = categoryBudgets.reduce((sum, b) => sum + b.spent, 0);
  }

  const totalRemaining = totalBudget - totalSpent;

  // Get categories without budgets (excluding monthly budget)
  const categoriesWithoutBudgets = categories.filter(
    (cat) => !categoryBudgets.some((b) => b.category_id === cat.id)
  );

  return (
    <div className="p-6 lg:p-8">
      <Header
        title="Budget Planner"
        subtitle="Set and manage your monthly budgets"
      />

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleDateString("en-IN", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={today.getFullYear() - 2 + i}>
                {today.getFullYear() - 2 + i}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">Total Budget</p>
          <p className="text-3xl font-bold text-blue-600">
            ₹{totalBudget.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-red-600">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">Remaining</p>
          <p className="text-3xl font-bold text-green-600">
            ₹{totalRemaining.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      {totalBudget > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Overall Progress
          </h3>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(
                  (totalSpent / totalBudget) * 100
                )} transition-all duration-300`}
                style={{
                  width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{getPercentage(totalSpent, totalBudget)}% spent</span>
              <span>₹{totalRemaining.toLocaleString("en-IN")} remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Budget Section */}
      {monthlyBudget && (
        <div className={`rounded-lg shadow-md p-6 mb-8 border-2 ${
          monthlyBudget.status === "overspent"
            ? "bg-red-50 border-red-300"
            : monthlyBudget.status === "warning"
            ? "bg-yellow-50 border-yellow-300"
            : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${
                monthlyBudget.status === "overspent"
                  ? "text-red-900"
                  : monthlyBudget.status === "warning"
                  ? "text-yellow-900"
                  : "text-blue-900"
              }`}>
                📅 Monthly Budget
              </h3>
              <p className={`text-3xl font-bold mb-2 ${
                monthlyBudget.status === "overspent"
                  ? "text-red-600"
                  : monthlyBudget.status === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}>
                ₹{monthlyBudget.monthly_limit.toLocaleString("en-IN")}
              </p>
              <p className={`text-sm mb-3 ${
                monthlyBudget.status === "overspent"
                  ? "text-red-800"
                  : monthlyBudget.status === "warning"
                  ? "text-yellow-800"
                  : "text-blue-800"
              }`}>
                {monthlyBudget.spent > monthlyBudget.monthly_limit
                  ? `⚠️ Over budget by ₹${(monthlyBudget.spent - monthlyBudget.monthly_limit).toLocaleString("en-IN")}`
                  : `✅ ${(monthlyBudget.monthly_limit - monthlyBudget.spent).toLocaleString("en-IN")} remaining`}
              </p>
              <div className={`w-64 h-3 rounded-full overflow-hidden ${
                monthlyBudget.status === "overspent"
                  ? "bg-red-200"
                  : monthlyBudget.status === "warning"
                  ? "bg-yellow-200"
                  : "bg-blue-200"
              }`}>
                <div
                  className={`h-full ${getProgressColor(
                    (monthlyBudget.spent / monthlyBudget.monthly_limit) * 100
                  )} transition-all duration-300`}
                  style={{
                    width: `${Math.min(
                      (monthlyBudget.spent / monthlyBudget.monthly_limit) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${
                monthlyBudget.status === "overspent"
                  ? "text-red-700"
                  : monthlyBudget.status === "warning"
                  ? "text-yellow-700"
                  : "text-blue-700"
              }`}>
                {getPercentage(monthlyBudget.spent, monthlyBudget.monthly_limit)}% spent
              </p>
              
              {/* Backend Warning */}
              {monthlyBudget.warning && (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
                  monthlyBudget.status === "overspent"
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                }`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{monthlyBudget.warning}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditBudget(monthlyBudget)}
                className={`p-2 rounded-lg transition-colors ${
                  monthlyBudget.status === "overspent"
                    ? "hover:bg-red-200 text-red-600"
                    : monthlyBudget.status === "warning"
                    ? "hover:bg-yellow-200 text-yellow-600"
                    : "hover:bg-blue-200 text-blue-600"
                }`}
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => handleDeleteBudget(monthlyBudget.id)}
                className="p-2 hover:bg-red-200 rounded-lg transition-colors text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Monthly Budget Button */}
      {!monthlyBudget && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 mb-8">
          <div className="text-center">
            <p className="text-gray-700 font-semibold mb-3">
              📅 No Monthly Budget Set
            </p>
            <button
              onClick={() => {
                const monthlyBudgetObj = { id: null, category_id: null };
                setSelectedCategory({ id: null, name: "Monthly Budget" });
                setEditingBudget(null);
                setSuggestedBudget(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              Set Monthly Budget
            </button>
          </div>
        </div>
      )}

      {/* Category Budgets */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Category Budgets
          </h3>
        </div>

        {categoryBudgets.map((budget) => {
          const percentage = getPercentage(budget.spent, budget.monthly_limit);
          const remaining = budget.monthly_limit - budget.spent;

          return (
            <div
              key={budget.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">
                    {getCategoryIcon(budget.category_id)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {getCategoryName(budget.category_id)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      ₹{budget.spent.toLocaleString("en-IN")} / ₹
                      {budget.monthly_limit.toLocaleString("en-IN")}
                    </p>
                    {budget.health_score < 100 && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp size={14} className="text-blue-600" />
                        <span className="text-xs text-blue-600">
                          Health: {budget.health_score}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditBudget(budget)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(
                      percentage
                    )} transition-all duration-300`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span
                    className={`font-semibold ${
                      percentage > 100 ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {percentage}% spent
                  </span>
                  <span
                    className={percentage > 100 ? "text-red-600" : "text-green-600"}
                  >
                    {percentage > 100
                      ? `₹${Math.abs(remaining).toLocaleString("en-IN")} over budget`
                      : `₹${remaining.toLocaleString("en-IN")} remaining`}
                  </span>
                </div>
              </div>

              {/* Warning from Backend */}
              {budget.warning && (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
                  budget.status === "overspent"
                    ? "bg-red-50 text-red-800 border border-red-300"
                    : budget.status === "warning"
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-300"
                    : "bg-blue-50 text-blue-800 border border-blue-300"
                }`}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{budget.warning}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Budget for Categories Without Budgets */}
        {categoriesWithoutBudgets.length > 0 && (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
            <h4 className="font-semibold text-gray-700 mb-4">
              Add Budget for More Categories
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categoriesWithoutBudgets.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleAddBudget(category.id)}
                  className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <span className="text-2xl">
                    {categoryIcons[category.name] || categoryIcons.Other}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                  <Plus size={16} className="ml-auto text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {categoryBudgets.length === 0 && categoriesWithoutBudgets.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No categories available</p>
          </div>
        )}
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCategory(null);
          setSuggestedBudget(null);
          setEditingBudget(null);
        }}
        categoryName={selectedCategory?.name}
        categoryIcon={
          selectedCategory
            ? categoryIcons[selectedCategory.name] || categoryIcons.Other
            : ""
        }
        categoryId={selectedCategory?.id}
        suggestedBudget={suggestedBudget}
        currentBudget={editingBudget?.monthly_limit}
        onSave={handleSaveBudget}
        month={month}
        year={year}
      />
    </div>
  );
};

export default BudgetPlanner;


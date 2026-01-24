import api from "./axios";

export const createBudget = async (budget) => {
  const response = await api.post("/budgets", budget);
  return response.data;
};

export const getBudgets = async (month = null, year = null) => {
  let url = "/budgets";
  const params = new URLSearchParams();
  
  if (month !== null) params.append("month", month);
  if (year !== null) params.append("year", year);
  
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await api.get(url);
  return response.data;
};

export const deleteBudget = async (budgetId) => {
  const response = await api.delete(`/budgets/${budgetId}`);
  return response.data;
};

export const getBudgetInsights = async (month, year) => {
  const response = await api.get(
    `/budget-insights?month=${month}&year=${year}`
  );
  return response.data;
};

export const getBudgetSuggestion = async (categoryId) => {
  const response = await api.get(`/budget-suggestions/${categoryId}`);
  return response.data;
};


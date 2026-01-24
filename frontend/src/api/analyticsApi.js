import api from "./axios";

export const getCategoryPie = async (month, year) => {
  const response = await api.get(
    `/analytics/category-pie?month=${month}&year=${year}`
  );
  return response.data;
};

export const getMonthlyTrend = async (year) => {
  const response = await api.get(`/analytics/monthly-trend?year=${year}`);
  return response.data;
};

export const getIncomeExpense = async (month, year) => {
  const response = await api.get(
    `/analytics/income-expense?month=${month}&year=${year}`
  );
  return response.data;
};

export const getSavingsRate = async (month, year) => {
  const response = await api.get(
    `/analytics/savings-rate?month=${month}&year=${year}`
  );
  return response.data;
};

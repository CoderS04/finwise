import api from "./axios";

export const getGoals = async () => {
  const response = await api.get("/goals");
  return response.data;
};

export const createGoal = async (goalData) => {
  const response = await api.post("/goals", goalData);
  return response.data;
};

export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/goals/${goalId}`);
  return response.data;
};

export const getGoalInsights = async (goalId) => {
  const response = await api.get(`/goal-insights/${goalId}`);
  return response.data;
};

export const getGoalBudgetLinks = async (month, year) => {
  const response = await api.get(
    `/goal-budget-link?month=${month}&year=${year}`
  );
  return response.data;
};

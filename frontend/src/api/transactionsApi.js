import api from "./axios";

export const fetchTransactions = async () => {
  const response = await api.get("/transactions");
  return response.data;
};

export const addTransaction = async (transaction) => {
  const response = await api.post("/transactions", transaction);
  return response.data;
};

export const updateTransaction = async (id, transaction) => {
  const response = await api.put(`/transactions/${id}`, transaction);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const fetchCategories = async () => {
  const response = await api.get("/transactions/categories");
  return response.data;
};

export const fetchAccounts = async () => {
  const response = await api.get("/transactions/accounts");
  return response.data;
};

export const uploadCsv = async (file, accountId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("account_id", accountId);

  const response = await api.post("/transactions/upload", formData);
  return response.data;
};

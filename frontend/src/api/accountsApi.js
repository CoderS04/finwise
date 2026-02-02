import api from "./axios";

export const getAccounts = async () => {
  const res = await api.get("/accounts");
  return res.data;
};

export const createAccount = async (payload) => {
  const res = await api.post("/accounts", payload);
  return res.data;
};

export const updateAccount = async (id, payload) => {
  const res = await api.put(`/accounts/${id}`, payload);
  return res.data;
};

export const deleteAccount = async (id) => {
  const res = await api.delete(`/accounts/${id}`);
  return res.data;
};

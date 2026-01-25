import api from "./axios";

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  }, {
  headers: {
    "Content-Type": "application/json"
  }
});
  return response.data;
};

export const registerUser = async (email, password) => {
  const response = await api.post("/auth/register", {
    email,
    password,
  }, {
  headers: {
    "Content-Type": "application/json"
  }
});
  return response.data;
};

const handleLogin = async () => {
  const data = await loginUser(email, password);
  localStorage.setItem("token", data.access_token);
};

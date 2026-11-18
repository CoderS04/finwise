import api from "./axios";

export const detectSavings = async (month, year, userConfirmedAmount = null) => {
  const params = {
    month,
    year
  };

  if (userConfirmedAmount !== null && userConfirmedAmount !== "") {
    params.user_confirmed_amount = userConfirmedAmount;
  }

  const response = await api.post("/savings-detection", null, { params });
  return response.data;
};

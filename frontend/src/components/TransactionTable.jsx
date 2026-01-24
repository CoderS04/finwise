const TransactionTable = ({ transactions }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Type</th>
        </tr>
      </thead>

      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id}>
            <td>{tx.transaction_date.split("T")[0]}</td>
            <td>{tx.description}</td>
            <td>₹{tx.amount}</td>
            <td>{tx.transaction_type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TransactionTable;

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

function IncomeList() {
  const [income, setIncome] = useState([]);
  const [search, setSearch] = useState("");

  const loadIncome = async () => {
    const snapshot = await getDocs(collection(db, "income"));

    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setIncome(list);
  };

  useEffect(() => {
    loadIncome();
  }, []);

  const deleteIncome = async (id) => {
    if (window.confirm("Delete this income?")) {
      await deleteDoc(doc(db, "income", id));
      loadIncome();
    }
  };

  const filtered = income.filter((item) =>
    item.category?.toLowerCase().includes(search.toLowerCase()) ||
    item.receivedFrom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="income-list">

      <h2>Income List</h2>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Received From</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td>{item.date}</td>
              <td>{item.receivedFrom}</td>
              <td>{item.category}</td>
              <td>₹ {item.amount}</td>
              <td>
                <button>Edit</button>
                <button
                  onClick={() => deleteIncome(item.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default IncomeList;
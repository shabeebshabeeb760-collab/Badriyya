import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "./Income.css";

function Income() {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    category: "",
    receivedFrom: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveIncome = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "income"), {
        ...form,
        amount: Number(form.amount),
        createdAt: new Date(),
      });

      alert("Income Added Successfully");

      setForm({
        date: "",
        amount: "",
        category: "",
        receivedFrom: "",
        description: "",
      });
    } catch (err) {
      console.error(err);
      alert("Error Saving Income");
    }
  };

  return (
    <div className="income-page">
      <div className="income-card">

        <h2>Add Income</h2>

        <form onSubmit={saveIncome}>

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="receivedFrom"
            placeholder="Received From"
            value={form.receivedFrom}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <button type="submit">
            Save Income
          </button>

        </form>

      </div>
    </div>
  );
}

export default Income;
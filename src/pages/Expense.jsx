import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import BackButton from "../components/BackButton";
import { db } from "../firebase/firebase";
import "./Expense.css";
import {
  FaWallet,
  FaSave,
  FaArrowLeft
} from "react-icons/fa";
function Expense() {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    category: "",
    paidTo: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveExpense = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "expenses"), {
        ...form,
        amount: Number(form.amount),
        createdAt: new Date(),
      });

      alert("Expense Added Successfully");

      setForm({
        date: "",
        amount: "",
        category: "",
        paidTo: "",
        description: "",
      });

    } catch (err) {
      console.log(err);
      alert("Error");
    }
  };

  return (
    <div className="expense-page">
        <BackButton />

      <div className="expense-card">

        <h2>Add Expense</h2>

        <form onSubmit={saveExpense}>

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

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option>Salary</option>
            <option>Electricity</option>
            <option>Food</option>
            <option>Maintenance</option>
            <option>Office</option>
            <option>Fish</option>
            <option>Other</option>
          </select>

          <input
            type="text"
            name="paidTo"
            placeholder="Paid To"
            value={form.paidTo}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <button type="submit">
            Save Expense
          </button>

        </form>

      </div>
    </div>
  );
}

export default Expense;
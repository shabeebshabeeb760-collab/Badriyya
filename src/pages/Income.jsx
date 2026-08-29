import { useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import "./Income.css";
import BackButton from "../components/BackButton";

function Income() {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    receivedFrom: "",
    description: "",
  });

  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);

  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // GET NEXT RECEIPT NUMBER
  // =========================

  const getNextReceiptNo = async () => {
    try {
      const q = query(
        collection(db, "income"),
        orderBy("receiptNo", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return 1339;
      }

      const last = Number(
        snapshot.docs[0].data().receiptNo || 1338
      );

      return last + 1;

    } catch (error) {
      console.error("Receipt Number Error:", error);

      return 1339;
    }
  };

  // =========================
  // SAVE INCOME
  // =========================

  const saveIncome = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      const receiptNo = await getNextReceiptNo();

      const incomeData = {
        date: form.date,
        amount: Number(form.amount),
        receivedFrom: form.receivedFrom,
        description: form.description,
        receiptNo: receiptNo,
        createdAt: new Date(),
      };

      await addDoc(
        collection(db, "income"),
        incomeData
      );

      // Show receipt
      setReceipt(incomeData);

      // Clear form
      setForm({
        date: "",
        amount: "",
        receivedFrom: "",
        description: "",
      });

    } catch (error) {
      console.error("Income Save Error:", error);

      alert("Error Saving Income");

    } finally {
      setSaving(false);
    }
  };

  // =========================
  // PRINT RECEIPT
  // =========================

  const printReceipt = () => {
    window.print();
  };

  // =========================
  // CLOSE RECEIPT
  // =========================

  const closeReceipt = () => {
    setReceipt(null);
  };

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (date) => {
    if (!date) return "";

    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="income-page">

      {/* =========================
          INCOME FORM
      ========================= */}

      {!receipt && (
        <>
          <BackButton />

          <div className="income-card">

            <h2>Add Income</h2>

            <form onSubmit={saveIncome}>

              {/* DATE */}

              <label>Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              {/* AMOUNT */}

              <label>Amount</label>

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange}
                min="1"
                required
              />

              {/* RECEIVED FROM */}

              <label>Received From</label>

              <input
                type="text"
                name="receivedFrom"
                placeholder="Received From"
                value={form.receivedFrom}
                onChange={handleChange}
              />

              {/* DESCRIPTION */}

              <label>Description</label>

              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />

              {/* SAVE */}

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Income"}
              </button>

            </form>

          </div>
        </>
      )}

      {/* =========================
          RECEIPT
      ========================= */}

      {receipt && (
        <div className="receipt-screen">

          {/* TOOLBAR */}

          <div className="receipt-toolbar">

            <button
              onClick={printReceipt}
            >
              🖨 Print Receipt
            </button>

            <button
              className="receipt-close"
              onClick={closeReceipt}
            >
              ✕ Close
            </button>

          </div>

          {/* RECEIPT */}

          <div className="receipt-print-area">

            <img
              src="/receipt.jpg"
              className="receipt-template"
              alt="Receipt"
            />

            {/* RECEIPT NUMBER */}

            <div className="receipt-field receipt-number">
              {receipt.receiptNo}
            </div>

            {/* DATE */}

            <div className="receipt-field receipt-date">
              {formatDate(receipt.date)}
            </div>

            {/* NAME */}

            <div className="receipt-field receipt-name">
              {receipt.receivedFrom}
            </div>

            {/* DESCRIPTION */}

            <div className="receipt-field receipt-description">
              {receipt.description}
            </div>

            {/* AMOUNT */}

            <div className="receipt-field receipt-amount-value">
              ₹{" "}
              {Number(
                receipt.amount
              ).toLocaleString("en-IN")}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Income;
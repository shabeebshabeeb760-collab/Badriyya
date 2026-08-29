import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../firebase/firebase";
import BackButton from "../components/BackButton";
import "./CreditPurchaseCategory.css";

function CreditPurchaseCategory() {
  const { category } = useParams();

  const categoryName =
    category?.charAt(0).toUpperCase() + category?.slice(1);

  const [records, setRecords] = useState([]);

  const [form, setForm] = useState({
    date: "",
    amount: "",
    type: "cost",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  // ===============================
  // LOAD RECORDS
  // ===============================

  useEffect(() => {
    const q = query(
      collection(db, "creditPurchases"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (item) =>
              item.category?.toLowerCase() ===
              category?.toLowerCase()
          );

        setRecords(data);
      },
      (error) => {
        console.error("Credit Purchase Error:", error);
      }
    );

    return () => unsubscribe();
  }, [category]);

  // ===============================
  // INPUT CHANGE
  // ===============================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ===============================
  // SAVE
  // ===============================

  const saveRecord = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!form.date || !form.amount) {
      alert("Please enter Date and Amount");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "creditPurchases"), {
        category: categoryName,
        date: form.date,
        amount: Number(form.amount),
        type: form.type,
        description: form.description,
        createdAt: serverTimestamp(),
      });

      setForm({
        date: "",
        amount: "",
        type: "cost",
        description: "",
      });

      alert("Saved Successfully");
    } catch (error) {
      console.error(error);
      alert("Error saving record");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // TOTALS
  // ===============================

  const totalIncome = records
    .filter((item) => item.type === "income")
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

  const totalCost = records
    .filter((item) => item.type === "cost")
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

  const pendingBalance = totalCost - totalIncome;

  const money = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

  // ===============================
  // RETURN
  // ===============================

  return (
    <div className="credit-category-page">

      <BackButton />

      {/* HEADER */}

      <div className="credit-header">

        <div>
          <h1>{categoryName}</h1>
          <p>Credit Purchase Records</p>
        </div>

      </div>

      {/* SUMMARY CARDS */}

      <div className="credit-summary">

        {/* TOTAL INCOME */}

        <div className="summary-card income-card">

          <div className="summary-icon">
            ₹
          </div>

          <div>
            <span>Total Income</span>
            <h2>{money(totalIncome)}</h2>
          </div>

        </div>

        {/* TOTAL COST */}

        <div className="summary-card cost-card">

          <div className="summary-icon">
            ₹
          </div>

          <div>
            <span>Total Cost</span>
            <h2>{money(totalCost)}</h2>
          </div>

        </div>

        {/* PENDING */}

        <div className="summary-card pending-card">

          <div className="summary-icon">
            ₹
          </div>

          <div>
            <span>Pending Balance</span>
            <h2>{money(pendingBalance)}</h2>
          </div>

        </div>

      </div>

      {/* ADD RECORD */}

      <div className="credit-form-card">

        <div className="form-title">
          <h2>Add {categoryName}</h2>
          <p>Enter income or cost details</p>
        </div>

        <form onSubmit={saveRecord}>

          <div className="form-grid">

            {/* DATE */}

            <div className="form-group">

              <label>Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

            </div>

            {/* AMOUNT */}

            <div className="form-group">

              <label>Amount</label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                min="1"
                required
              />

            </div>

            {/* TYPE */}

            <div className="form-group">

              <label>Type</label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="cost">
                  Cost
                </option>

                <option value="income">
                  Income
                </option>
              </select>

            </div>

            {/* DESCRIPTION */}

            <div className="form-group">

              <label>Description</label>

              <input
                type="text"
                name="description"
                placeholder="Optional description"
                value={form.description}
                onChange={handleChange}
              />

            </div>

          </div>

          <button
            type="submit"
            className="save-credit-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "＋ Save Record"}
          </button>

        </form>

      </div>

      {/* RECORDS */}

      <div className="credit-records">

        <div className="records-header">

          <div>
            <h2>Records</h2>
            <p>{records.length} transactions</p>
          </div>

        </div>

        {records.length === 0 ? (

          <div className="empty-records">
            <div>📋</div>
            <h3>No Records Yet</h3>
            <p>
              Add your first {categoryName} record above.
            </p>
          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>

                {records.map((item) => (

                  <tr key={item.id}>

                    <td>
                      {item.date
                        ? new Date(
                            item.date + "T00:00:00"
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td>

                      <span
                        className={
                          item.type === "income"
                            ? "type-badge income"
                            : "type-badge cost"
                        }
                      >
                        {item.type === "income"
                          ? "Income"
                          : "Cost"}
                      </span>

                    </td>

                    <td>
                      {item.description || "-"}
                    </td>

                    <td
                      className={
                        item.type === "income"
                          ? "amount-income"
                          : "amount-cost"
                      }
                    >
                      {money(item.amount)}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default CreditPurchaseCategory;
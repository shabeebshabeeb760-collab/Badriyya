import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import "./CalendarSales.css";

function CalendarSales() {
  const [form, setForm] = useState({
    salesmanName: "",
    customerName: "",
    place: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    amount: "",
    cashReceived: "",
    paymentMethod: "Cash",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const quantity = Number(form.quantity || 0);
  const amount = Number(form.amount || 0);
  const cashReceived = Number(form.cashReceived || 0);

  const pending = Math.max(amount - cashReceived, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.salesmanName.trim()) {
      alert("Salesman Name enter ചെയ്യുക");
      return;
    }

    if (!form.place.trim()) {
      alert("Sale Place enter ചെയ്യുക");
      return;
    }

    if (quantity <= 0) {
      alert("Calendar Quantity enter ചെയ്യുക");
      return;
    }

    if (amount < 0 || cashReceived < 0) {
      alert("Amount ശരിയായി enter ചെയ്യുക");
      return;
    }

    if (cashReceived > amount) {
      alert("Cash Received, Total Sale Amount-നേക്കാൾ കൂടുതലാകരുത്");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "calendarSales"), {
        salesmanName: form.salesmanName.trim(),
        customerName: form.customerName.trim(),
        place: form.place.trim(),
        date: form.date,
        quantity,
        amount,
        cashReceived,
        pending,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      });

      alert("Calendar Sale successfully saved ✅");

      setForm({
        salesmanName: "",
        customerName: "",
        place: "",
        date: new Date().toISOString().split("T")[0],
        quantity: "",
        amount: "",
        cashReceived: "",
        paymentMethod: "Cash",
        notes: "",
      });
    } catch (error) {
      console.error(error);
      alert("Sale save ചെയ്യാൻ കഴിഞ്ഞില്ല");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="calendar-sales-page">
      <div className="calendar-sales-header">
        <div>
          <h1>📅 Calendar Sales</h1>
          <p>Record salesman calendar sales and collection</p>
        </div>
      </div>

      <form className="calendar-sales-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Sale Details</h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Salesman Name *</label>
              <input
                type="text"
                name="salesmanName"
                value={form.salesmanName}
                onChange={handleChange}
                placeholder="Enter salesman name"
              />
            </div>

            <div className="form-group">
              <label>Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
              />
            </div>

            <div className="form-group">
              <label>Sale Place *</label>
              <input
                type="text"
                name="place"
                value={form.place}
                onChange={handleChange}
                placeholder="Eg: Kottayam"
              />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Calendar Quantity *</label>
              <input
                type="number"
                min="1"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Total Sale Amount ₹</label>
              <input
                type="number"
                min="0"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Cash Received ₹</label>
              <input
                type="number"
                min="0"
                name="cashReceived"
                value={form.cashReceived}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="amount-preview">
          <div>
            <span>Calendars</span>
            <strong>{quantity}</strong>
          </div>

          <div>
            <span>Total Sale</span>
            <strong>₹{amount.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span>Cash Received</span>
            <strong className="cash">
              ₹{cashReceived.toLocaleString("en-IN")}
            </strong>
          </div>

          <div>
            <span>Pending</span>
            <strong className="pending">
              ₹{pending.toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <div className="form-group notes-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional notes..."
            rows="3"
          />
        </div>

        <button
          type="submit"
          className="save-sale-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "💾 Save Calendar Sale"}
        </button>
      </form>
    </div>
  );
}

export default CalendarSales;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../firebase/firebase";
import "./CalendarSalesDashboard.css";

const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const initialForm = () => ({
  salesmanName: "",
  place: "",
  date: today(),
  quantity: "",
  amount: "",
  cashReceived: "",
  gpayReceived: "",
  notes: "",
});

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function Field({ label, icon, children, hint }) {
  return (
    <div className="premium-field">
      <label>{icon && <span>{icon}</span>} {label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function CalendarSales() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [shareMessage, setShareMessage] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    const salesQuery = query(
      collection(db, "calendarSales"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const nextRecords = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecords(nextRecords);
        setLoadingRecords(false);
      },
      (error) => {
        console.error("Calendar sales listen failed:", error);
        setLoadingRecords(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const quantity = Number(form.quantity || 0);
  const amount = Number(form.amount || 0);
  const cash = Number(form.cashReceived || 0);
  const gpay = Number(form.gpayReceived || 0);
  const totalCollected = cash + gpay;
  const pending = Math.max(amount - totalCollected, 0);
  const collectionPercent =
    amount > 0
      ? Math.min((totalCollected / amount) * 100, 100)
      : 0;
  const totalRecordedCash = records.reduce(
    (total, entry) => total + Number(entry.cashReceived || 0),
    0
  );
  const totalRecordedGpay = records.reduce(
    (total, entry) => total + Number(entry.gpayReceived || 0),
    0
  );
  const totalRecordedQuantity = records.reduce(
    (total, entry) => total + Number(entry.quantity || 0),
    0
  );

  const salesmanChartData = Object.entries(
    records.reduce((summary, entry) => {
      const name = (entry.salesmanName || "Unknown").trim() || "Unknown";
      const total = Number(entry.totalCollected || entry.amount || 0);
      summary[name] = (summary[name] || 0) + total;
      return summary;
    }, {})
  )
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxChartValue = Math.max(
    ...salesmanChartData.map((item) => item.total),
    1
  );

  const todayTopSalesman = Object.entries(
    records
      .filter((entry) => entry.date === today())
      .reduce((summary, entry) => {
        const name = (entry.salesmanName || "Unknown").trim() || "Unknown";
        const total = Number(entry.totalCollected || entry.amount || 0);
        summary[name] = (summary[name] || 0) + total;
        return summary;
      }, {})
  )
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)[0];

  const paymentRecords = records
    .filter(
      (entry) =>
        Number(entry.cashReceived || 0) > 0 ||
        Number(entry.gpayReceived || 0) > 0
    )
    .slice(0, 6);

  const downloadPDF = () => {
    if (!records.length) {
      setMessage("No sales records available to download.");
      setMessageType("error");
      return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("BADRIYYA Calendar Sales Report", 14, 20);

    pdf.setFontSize(11);
    pdf.text(
      `Top Salesman: ${
        salesmanChartData[0]
          ? `${salesmanChartData[0].name} - ${money(salesmanChartData[0].total)}`
          : "N/A"
      }`,
      14,
      32
    );
    pdf.text(
      `Today Top Salesman: ${
        todayTopSalesman ? `${todayTopSalesman.name} - ${money(todayTopSalesman.total)}` : "N/A"
      }`,
      14,
      40
    );
    pdf.text(`Total Cash: ${money(totalRecordedCash)}`, 14, 48);
    pdf.text(`Total GPay: ${money(totalRecordedGpay)}`, 14, 56);
    pdf.text(
      `Total Calendar Quantity: ${totalRecordedQuantity.toLocaleString("en-IN")}`,
      14,
      64
    );

    autoTable(pdf, {
      startY: 72,
      head: [["Salesman", "Place", "Date", "Qty", "Amount", "Cash", "GPay", "Pending"]],
      body: records.map((entry) => [
        entry.salesmanName || "-",
        entry.place || "-",
        entry.date || "-",
        Number(entry.quantity || 0).toLocaleString("en-IN"),
        money(entry.amount || 0),
        money(entry.cashReceived || 0),
        money(entry.gpayReceived || 0),
        money(entry.pending || 0),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    pdf.save("badriyya-calendar-sales-report.pdf");
  };

  const updateField = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setMessage("");
  };

  const saveSale = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.salesmanName.trim()) {
      setMessage("Salesman name നൽകുക.");
      return;
    }

    if (!form.place.trim()) {
      setMessage("Sale place നൽകുക.");
      return;
    }

    if (!form.date) {
      setMessage("Date തിരഞ്ഞെടുക്കുക.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("Calendar quantity 1 അല്ലെങ്കിൽ അതിൽ കൂടുതലായിരിക്കണം.");
      return;
    }

    if (
      !Number.isFinite(amount) ||
      !Number.isFinite(cash) ||
      !Number.isFinite(gpay) ||
      amount < 0 ||
      cash < 0 ||
      gpay < 0
    ) {
      setMessage("Amount ശരിയായി നൽകുക.");
      return;
    }

    if (totalCollected > amount) {
      setMessage("Cash + GPay, Sale Amount-നെക്കാൾ കൂടുതലാണ്.");
      return;
    }

    try {
      setSaving(true);

      const saleData = {
        salesmanName: form.salesmanName.trim(),
        place: form.place.trim(),
        date: form.date,
        quantity,
        amount,
        cashReceived: cash,
        gpayReceived: gpay,
        totalCollected,
        pending,
        notes: form.notes.trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, "calendarSales", editingId), {
        ...saleData,
        updatedAt: serverTimestamp(),
        });
        setMessage("Calendar sale വിജയകരമായി update ചെയ്തു.");
      } else {
        await addDoc(collection(db, "calendarSales"), {
        ...saleData,
        createdAt: serverTimestamp(),
        });
        setMessage("Calendar sale വിജയകരമായി save ചെയ്തു.");
      }

      setMessageType("success");
      setForm(initialForm());
      setEditingId(null);
    } catch (error) {
      console.error(
        editingId ? "Calendar sales update failed:" : "Calendar sales save failed:",
        error
      );
      setMessageType("error");
      setMessage(
        `${editingId ? "Update" : "Save"} ചെയ്യാൻ കഴിഞ്ഞില്ല. Firebase configuration, Firestore Rules എന്നിവ പരിശോധിക്കുക.`
      );
    } finally {
      setSaving(false);
    }
  };

  const editSale = (entry) => {
    setForm({
      salesmanName: entry.salesmanName || "",
      place: entry.place || "",
      date: entry.date || today(),
      quantity: String(entry.quantity ?? ""),
      amount: String(entry.amount ?? ""),
      cashReceived: String(entry.cashReceived ?? ""),
      gpayReceived: String(entry.gpayReceived ?? ""),
      notes: entry.notes || "",
    });
    setEditingId(entry.id);
    setMessageType("success");
    setMessage("Update details and save to apply your changes.");
    document.querySelector(".premium-workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const deleteSale = async (entry) => {
    const confirmed = window.confirm(
      `Delete the calendar sale for ${entry.salesmanName || "this salesman"}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteDoc(doc(db, "calendarSales", entry.id));
      if (editingId === entry.id) {
        setEditingId(null);
        setForm(initialForm());
      }
      setMessageType("success");
      setMessage("Calendar sale deleted successfully.");
    } catch (error) {
      console.error("Calendar sales delete failed:", error);
      setMessageType("error");
      setMessage("Delete ചെയ്യാൻ കഴിഞ്ഞില്ല. Firestore Rules പരിശോധിക്കുക.");
    } finally {
      setSaving(false);
    }
  };

  const shareDashboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Dashboard link copied. Share it with anyone.");
    } catch (error) {
      console.error("Dashboard link copy failed:", error);
      setShareMessage("Could not copy the link. Copy it from your browser address bar.");
    }
  };

  return (
    <main className="premium-sales-page">
      <header className="premium-topbar">
        <button
          type="button"
          className="premium-brand"
          onClick={() => navigate("/dashboard")}
        >
          <span className="brand-symbol">B</span>
          <span>
            <strong>BADRIYYA</strong>
            <small>FINANCE MANAGEMENT</small>
          </span>
        </button>

        <div className="premium-topbar-actions">
          <button
            type="button"
            className="premium-share-button"
            onClick={shareDashboard}
          >
            Share Dashboard
          </button>
          <button
            type="button"
            className="premium-back"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </header>
      {shareMessage && (
        <div className="premium-share-status" role="status">
          {shareMessage}
        </div>
      )}

      <section className="premium-hero">
        <div className="hero-copy">
          <span className="eyebrow">SALES MANAGEMENT / ENTRY</span>
          <h1>Calendar Sales</h1>
          <p>
            Record sales, track collections, and monitor pending
            payments — all in one place.
          </p>
        </div>

        <div className="hero-date">
          <span>ENTRY DATE</span>
          <strong>
            {new Date(form.date + "T12:00:00").toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )}
          </strong>
          <span className="live-indicator">● Live calculation</span>
        </div>
      </section>

      <section className="premium-stat-grid">
        <article className="premium-stat stat-indigo">
          <span className="stat-icon">▦</span>
          <span className="stat-label">CALENDAR QUANTITY</span>
          <strong>{quantity.toLocaleString("en-IN")}</strong>
          <small>Calendars in this entry</small>
        </article>

        <article className="premium-stat stat-violet">
          <span className="stat-icon">₹</span>
          <span className="stat-label">SALE VALUE</span>
          <strong>{money(amount)}</strong>
          <small>Total sale amount</small>
        </article>

        <article className="premium-stat stat-green">
          <span className="stat-icon">↗</span>
          <span className="stat-label">TOTAL COLLECTION</span>
          <strong>{money(totalCollected)}</strong>
          <small>Cash + GPay</small>
        </article>

        <article className="premium-stat stat-orange">
          <span className="stat-icon">◷</span>
          <span className="stat-label">PENDING AMOUNT</span>
          <strong>{money(pending)}</strong>
          <small>Balance to collect</small>
        </article>
      </section>

      <form onSubmit={saveSale} className="premium-workspace">
        <div className="premium-main-column">
          <section className="premium-panel">
            <div className="panel-heading">
              <div className="panel-icon">01</div>
              <div>
                <h2>Sale Information</h2>
                <p>Enter the salesman and sale details.</p>
              </div>
            </div>

            <div className="premium-form-grid">
              <Field label="Salesman Name *" icon="♙">
                <input
                  name="salesmanName"
                  value={form.salesmanName}
                  onChange={updateField}
                  placeholder="Enter salesman name"
                  autoComplete="name"
                  required
                />
              </Field>

              <Field label="Sale Place *" icon="⌖">
                <input
                  name="place"
                  value={form.place}
                  onChange={updateField}
                  placeholder="Town, area or shop"
                  required
                />
              </Field>

              <Field label="Sale Date *" icon="▦">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={updateField}
                  required
                />
              </Field>

              <Field label="Calendar Quantity *" icon="▤">
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={updateField}
                  placeholder="e.g. 100"
                  min="1"
                  step="1"
                  required
                />
              </Field>

              <Field label="Total Sale Amount (₹) *" icon="₹">
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={updateField}
                  placeholder="e.g. 15000"
                  min="0"
                  step="0.01"
                  required
                />
              </Field>
            </div>
          </section>

          <section className="premium-panel">
            <div className="panel-heading">
              <div className="panel-icon payment-icon">02</div>
              <div>
                <h2>Collection Details</h2>
                <p>Enter cash and digital payments separately.</p>
              </div>
            </div>

            <div className="payment-input-grid">
              <div className="payment-input-card cash-card">
                <div className="payment-title">
                  <span className="payment-symbol">₹</span>
                  <span>
                    <strong>Cash Received</strong>
                    <small>Physical cash collection</small>
                  </span>
                </div>
                <div className="currency-input">
                  <span>₹</span>
                  <input
                    type="number"
                    name="cashReceived"
                    value={form.cashReceived}
                    onChange={updateField}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="payment-input-card gpay-card">
                <div className="payment-title">
                  <span className="payment-symbol">G</span>
                  <span>
                    <strong>GPay Received</strong>
                    <small>UPI / GPay collection</small>
                  </span>
                </div>
                <div className="currency-input">
                  <span>₹</span>
                  <input
                    type="number"
                    name="gpayReceived"
                    value={form.gpayReceived}
                    onChange={updateField}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="premium-collection-total">
              <div>
                <span className="collection-check">✓</span>
                <div>
                  <span className="collection-caption">
                    TOTAL COLLECTION
                  </span>
                  <strong>{money(totalCollected)}</strong>
                  <small>Cash {money(cash)} + GPay {money(gpay)}</small>
                </div>
              </div>
              <span className="auto-tag">AUTO CALCULATED</span>
            </div>

            <div className="collection-progress">
              <div className="progress-labels">
                <span>Payment progress</span>
                <strong>{collectionPercent.toFixed(1)}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Payment progress"
                aria-valuenow={Math.round(collectionPercent)}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className="progress-fill"
                  style={{ width: `${collectionPercent}%` }}
                />
              </div>
              <div className="progress-bottom">
                <span>Collected: {money(totalCollected)}</span>
                <span>Balance: {money(pending)}</span>
              </div>
            </div>
          </section>

          <section className="premium-panel">
            <div className="panel-heading">
              <div className="panel-icon notes-icon">03</div>
              <div>
                <h2>Additional Notes</h2>
                <p>Optional information about this sale.</p>
              </div>
            </div>

            <Field label="Notes / Remarks" icon="✎">
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                placeholder="Add any important details..."
                rows="3"
              />
            </Field>
          </section>
        </div>

        <aside className="premium-side-column">
          <section className="premium-receipt">
            <div className="receipt-top">
              <span className="receipt-label">SALE SUMMARY</span>
              <span className="receipt-badge">LIVE</span>
            </div>

            <h2>Collection Overview</h2>
            <p className="receipt-subtitle">
              This entry updates automatically as you type.
            </p>

            <div className="receipt-row">
              <span>Calendar Quantity</span>
              <strong>{quantity.toLocaleString("en-IN")}</strong>
            </div>
            <div className="receipt-row">
              <span>Sale Amount</span>
              <strong>{money(amount)}</strong>
            </div>
            <div className="receipt-row">
              <span>Cash Received</span>
              <strong className="cash-text">{money(cash)}</strong>
            </div>
            <div className="receipt-row">
              <span>GPay Received</span>
              <strong className="gpay-text">{money(gpay)}</strong>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-row receipt-total">
              <span>Total Collection</span>
              <strong>{money(totalCollected)}</strong>
            </div>
            <div className="receipt-row receipt-pending">
              <span>Pending Amount</span>
              <strong>{money(pending)}</strong>
            </div>

            <div className="receipt-note">
              <span>ⓘ</span>
              <p>
                Pending = Sale Amount − Cash − GPay.
                The balance updates automatically.
              </p>
            </div>
          </section>

          {message && (
            <div
              className={`premium-message ${messageType}`}
              role="status"
            >
              {messageType === "success" ? "✓ " : "⚠ "}
              {message}
            </div>
          )}

          <button
            type="submit"
            className="premium-save-button"
            disabled={saving}
          >
            <span>{saving ? "◌" : "✓"}</span>
            <span>
              <strong>
                {saving
                  ? editingId
                    ? "Updating Entry..."
                    : "Saving Entry..."
                  : editingId
                    ? "Update Sales Entry"
                    : "Save Sales Entry"}
              </strong>
              <small>
                {saving
                  ? "Please wait"
                  : editingId
                    ? "Apply changes to this record"
                    : "Save to BADRIYYA Finance"}
              </small>
            </span>
            <span className="save-arrow">→</span>
          </button>

          <button
            type="button"
            className="premium-reset-button"
            disabled={saving}
            onClick={() => {
              setForm(initialForm());
              setEditingId(null);
              setMessage("");
            }}
          >
            {editingId ? "Cancel Edit" : "↻ Reset Form"}
          </button>

          <div className="premium-security-note">
            <span>▣</span>
            <p>
              Your entry is saved to the configured Firebase
              Firestore database.
            </p>
          </div>
        </aside>
      </form>

      <section className="premium-analytics-panel">
        <div className="premium-record-header">
          <div>
            <span className="eyebrow record-eyebrow">ANALYTICS</span>
            <h2>Top Salesman & Report</h2>
          </div>
          <button
            type="button"
            className="premium-download-button"
            onClick={downloadPDF}
          >
            Download PDF
          </button>
        </div>

        <div className="premium-analytics-grid">
          <div className="premium-chart-card">
            <h3>Top Salesman</h3>
            {salesmanChartData.length === 0 ? (
              <div className="premium-empty-state">No sales data yet.</div>
            ) : (
              <div className="premium-chart-list">
                {salesmanChartData.map((item) => (
                  <div key={item.name} className="premium-chart-row">
                    <div className="premium-chart-label-wrap">
                      <span>{item.name}</span>
                      <strong>{money(item.total)}</strong>
                    </div>
                    <div className="premium-chart-track">
                      <div
                        className="premium-chart-fill"
                        style={{ width: `${(item.total / maxChartValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="premium-kpi-card">
            <h3>Day Top Salesman</h3>
            {todayTopSalesman ? (
              <>
                <div className="premium-kpi-name">{todayTopSalesman.name}</div>
                <div className="premium-kpi-value">{money(todayTopSalesman.total)}</div>
                <small>Today's best performer</small>
              </>
            ) : (
              <div className="premium-empty-state">No sales today yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="premium-record-panel">
        <div className="premium-record-header">
          <div>
            <span className="eyebrow record-eyebrow">COLLECTIONS</span>
            <h2>Cash &amp; GPay Records</h2>
          </div>
          <span className="record-count">{paymentRecords.length} entries</span>
        </div>

        {loadingRecords ? (
          <div className="premium-record-loading">Loading records...</div>
        ) : paymentRecords.length === 0 ? (
          <div className="premium-record-empty">
            No cash or GPay collections recorded yet.
          </div>
        ) : (
          <div className="premium-record-table-wrap">
            <table className="premium-record-table">
              <thead>
                <tr>
                  <th>Salesman</th>
                  <th>Place</th>
                  <th>Date</th>
                  <th>Cash</th>
                  <th>GPay</th>
                  <th>Total Collected</th>
                </tr>
              </thead>
              <tbody>
                {paymentRecords.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.salesmanName || "-"}</td>
                    <td>{entry.place || "-"}</td>
                    <td>
                      {entry.date
                        ? new Date(`${entry.date}T12:00:00`).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td>{money(entry.cashReceived || 0)}</td>
                    <td>{money(entry.gpayReceived || 0)}</td>
                    <td>
                      {money(
                        entry.totalCollected ??
                          Number(entry.cashReceived || 0) +
                            Number(entry.gpayReceived || 0)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="premium-record-panel">
        <div className="premium-record-header">
          <div>
            <span className="eyebrow record-eyebrow">RECORDS</span>
            <h2>Saved Calendar Sales</h2>
          </div>
          <div className="premium-record-actions">
            <span className="record-count">{records.length} entries</span>
            <button
              type="button"
              className="premium-download-button"
              onClick={downloadPDF}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="saved-sales-summary">
          <article className="saved-sales-summary-card cash-summary-card">
            <span>Total Cash</span>
            <strong>{money(totalRecordedCash)}</strong>
          </article>
          <article className="saved-sales-summary-card gpay-summary-card">
            <span>Total GPay</span>
            <strong>{money(totalRecordedGpay)}</strong>
          </article>
          <article className="saved-sales-summary-card quantity-summary-card">
            <span>Total Calendar Quantity</span>
            <strong>{totalRecordedQuantity.toLocaleString("en-IN")}</strong>
          </article>
        </div>

        {loadingRecords ? (
          <div className="premium-record-loading">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="premium-record-empty">
            No sales entries saved yet.
          </div>
        ) : (
          <div className="premium-record-table-wrap">
            <table className="premium-record-table">
              <thead>
                <tr>
                  <th>Salesman</th>
                  <th>Place</th>
                  <th>Date</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Collected</th>
                  <th>Pending</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.salesmanName || "-"}</td>
                    <td>{entry.place || "-"}</td>
                    <td>
                      {entry.date
                        ? new Date(`${entry.date}T12:00:00`).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td>{Number(entry.quantity || 0).toLocaleString("en-IN")}</td>
                    <td>{money(entry.amount || 0)}</td>
                    <td>{money(entry.totalCollected || 0)}</td>
                    <td>{money(entry.pending || 0)}</td>
                    <td className="record-actions-cell">
                      <button
                        type="button"
                        className="record-edit-button"
                        onClick={() => editSale(entry)}
                        disabled={saving}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="record-delete-button"
                        onClick={() => deleteSale(entry)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="premium-footer">
        <span>BADRIYYA FINANCE</span>
        <span>Calendar Sales Management by BOSS</span>
      </footer>
    </main>
  );
}

export default CalendarSales;

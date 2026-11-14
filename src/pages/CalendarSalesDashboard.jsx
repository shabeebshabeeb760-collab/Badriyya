
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
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [editingId, setEditingId] = useState(null);
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
  const totalRecordedSales = records.reduce(
    (total, entry) => total + Number(entry.amount || 0),
    0
  );
  const totalRecordedPending = records.reduce(
    (total, entry) =>
      total +
      Math.max(
        Number(entry.amount || 0) -
          Number(entry.cashReceived || 0) -
          Number(entry.gpayReceived || 0),
        0
      ),
    0
  );
  const todayTopSalesman = Object.entries(
    records
      .filter((entry) => entry.date === today())
      .reduce((summary, entry) => {
        const name = (entry.salesmanName || "Unknown").trim() || "Unknown";
        const total = Number(entry.amount || 0);
        summary[name] = (summary[name] || 0) + total;
        return summary;
      }, {})
  )
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)[0];

  const downloadPDF = async (dateFilter = "") => {
    const reportRecords = dateFilter
      ? records.filter((entry) => entry.date === dateFilter)
      : records;
    if (!reportRecords.length) {
      setMessage(
        dateFilter
          ? "No sales records found for the selected date."
          : "No sales records available to download."
      );
      setMessageType("error");
      return;
    }

    try {
      setDownloadingReport(true);
      setMessage("");
      const reportTotals = reportRecords.reduce(
        (totals, entry) => {
          const amount = Number(entry.amount || 0);
          const cashAmount = Number(entry.cashReceived || 0);
          const gpayAmount = Number(entry.gpayReceived || 0);
          totals.sales += amount;
          totals.cash += cashAmount;
          totals.gpay += gpayAmount;
          totals.quantity += Number(entry.quantity || 0);
          totals.pending += Math.max(amount - cashAmount - gpayAmount, 0);
          const salesman = (entry.salesmanName || "Unknown").trim() || "Unknown";
          totals.salesBySalesman[salesman] =
            (totals.salesBySalesman[salesman] || 0) + amount;
          return totals;
        },
        { sales: 0, cash: 0, gpay: 0, quantity: 0, pending: 0, salesBySalesman: {} }
      );
      const reportTopSalesman = Object.entries(reportTotals.salesBySalesman).sort(
        (a, b) => b[1] - a[1]
      )[0];
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const pdf = new jsPDF({ orientation: "landscape" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 14;
      const generatedDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const reportDateLabel = dateFilter
        ? new Date(`${dateFilter}T12:00:00`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "";

      pdf.setFillColor(23, 58, 53);
      pdf.rect(0, 0, pageWidth, 39, "F");
      pdf.setFillColor(201, 154, 69);
      pdf.rect(0, 39, pageWidth, 2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("BADRIYYA", margin, 17);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(225, 238, 232);
      pdf.setFontSize(9);
      pdf.text("FINANCE MANAGEMENT", margin, 24);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.text(
        dateFilter ? "DATE-WISE SALES REPORT" : "CALENDAR SALES REPORT",
        pageWidth - margin,
        17,
        {
        align: "right",
        }
      );
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(225, 238, 232);
      pdf.setFontSize(9);
      pdf.text(
        dateFilter ? `Report date ${reportDateLabel}` : `Generated ${generatedDate}`,
        pageWidth - margin,
        25,
        {
        align: "right",
        }
      );

      const summaryCards = [
        {
          label: "TOTAL SALES",
          value: money(reportTotals.sales),
          color: [23, 107, 91],
        },
        {
          label: "CASH RECEIVED",
          value: money(reportTotals.cash),
          color: [42, 127, 93],
        },
        {
          label: "GPAY RECEIVED",
          value: money(reportTotals.gpay),
          color: [53, 112, 153],
        },
        {
          label: "PENDING BALANCE",
          value: money(reportTotals.pending),
          color: [180, 119, 45],
        },
      ];
      const cardGap = 5;
      const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
      const cardY = 49;
      const cardHeight = 24;

      summaryCards.forEach((card, index) => {
        const x = margin + index * (cardWidth + cardGap);
        pdf.setFillColor(248, 250, 248);
        pdf.setDrawColor(226, 234, 229);
        pdf.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");
        pdf.setFillColor(...card.color);
        pdf.roundedRect(x, cardY, 2, cardHeight, 1, 1, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(107, 126, 118);
        pdf.text(card.label, x + 7, cardY + 8);
        pdf.setFontSize(12);
        pdf.setTextColor(30, 55, 48);
        pdf.text(card.value, x + 7, cardY + 18);
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(89, 107, 99);
      const topSalesmanText = reportTopSalesman
        ? `${reportTopSalesman[0]} - ${money(reportTopSalesman[1])}`
        : "N/A";
      pdf.text(`Top salesman: ${topSalesmanText}`, margin, 82);
      if (!dateFilter && todayTopSalesman) {
        pdf.text(
          `Today's top: ${todayTopSalesman.name} - ${money(todayTopSalesman.total)}`,
          pageWidth / 2,
          82
        );
      }
      pdf.text(
        `Total calendars: ${reportTotals.quantity.toLocaleString("en-IN")}  |  Entries: ${reportRecords.length}`,
        pageWidth - margin,
        82,
        { align: "right" }
      );

      autoTable(pdf, {
        startY: 88,
        margin: { left: margin, right: margin, bottom: 17 },
        head: [["Salesman", "Place", "Date", "Qty", "Amount", "Cash", "GPay", "Pending"]],
        body: reportRecords.map((entry) => [
          entry.salesmanName || "-",
          entry.place || "-",
          entry.date
            ? new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
          Number(entry.quantity || 0).toLocaleString("en-IN"),
          money(entry.amount || 0),
          money(entry.cashReceived || 0),
          money(entry.gpayReceived || 0),
          money(
            entry.pending ??
              Math.max(
                Number(entry.amount || 0) -
                  Number(entry.cashReceived || 0) -
                  Number(entry.gpayReceived || 0),
                0
              )
          ),
        ]),
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3.2,
          textColor: [45, 64, 57],
          lineColor: [231, 237, 233],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [23, 58, 53],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [246, 249, 246] },
        columnStyles: {
          0: { cellWidth: 39 },
          1: { cellWidth: 39 },
          2: { cellWidth: 31 },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 36, halign: "right" },
          5: { cellWidth: 34, halign: "right" },
          6: { cellWidth: 34, halign: "right" },
          7: { cellWidth: 34, halign: "right" },
        },
        didDrawPage: () => {
          const pageHeight = pdf.internal.pageSize.getHeight();
          pdf.setDrawColor(222, 231, 225);
          pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(117, 132, 124);
          pdf.text("Calendar Sales Management by BOSS", margin, pageHeight - 7);
          pdf.text(
            `Page ${pdf.internal.getNumberOfPages()}`,
            pageWidth - margin,
            pageHeight - 7,
            { align: "right" }
          );
        },
      });

      pdf.save(
        dateFilter
          ? `badriyya-calendar-sales-${dateFilter}.pdf`
          : "badriyya-calendar-sales-report.pdf"
      );
    } catch (error) {
      console.error("Calendar sales PDF generation failed:", error);
      setMessage("Could not create the PDF report. Please try again.");
      setMessageType("error");
    } finally {
      setDownloadingReport(false);
    }
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
            <small>FINANCE</small>
          </span>
        </button>

        <button
          type="button"
          className="premium-back"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </header>

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
          <strong>{totalRecordedQuantity.toLocaleString("en-IN")}</strong>
          <small>Total calendars sold</small>
        </article>

        <article className="premium-stat stat-violet">
          <span className="stat-icon">₹</span>
          <span className="stat-label">TOTAL SALES</span>
          <strong>{money(totalRecordedSales)}</strong>
          <small>Saved sale amount</small>
        </article>

        <article className="premium-stat stat-orange">
          <span className="stat-icon">◷</span>
          <span className="stat-label">TOTAL PENDING</span>
          <strong>{money(totalRecordedPending)}</strong>
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

      <section className="premium-record-panel compact-record-panel">
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
              disabled={downloadingReport}
            >
              {downloadingReport ? "Preparing PDF..." : "Download PDF"}
            </button>
            <label className="report-date-picker">
              <span>Report date</span>
              <input
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                aria-label="Select a date for the sales report"
              />
            </label>
            <button
              type="button"
              className="premium-download-button date-report-button"
              onClick={() => downloadPDF(reportDate)}
              disabled={!reportDate || downloadingReport}
            >
              {downloadingReport ? "Preparing..." : "Download Date Report"}
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
            <span>Total Quantity</span>
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

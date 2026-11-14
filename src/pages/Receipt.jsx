import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "./Receipt.css";

function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncome = async () => {
      try {
        const snap = await getDoc(doc(db, "income", id));

        if (!snap.exists()) {
          setIncome(null);
          return;
        }

        setIncome({
          id: snap.id,
          ...snap.data(),
        });
      } catch (error) {
        console.error("Receipt error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadIncome();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="receipt-loading">
        Loading Receipt...
      </div>
    );
  }

  if (!income) {
    return (
      <div className="receipt-error">
        <h2>Receipt not found</h2>

        <button onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const date = income.date
    ? new Date(income.date).toLocaleDateString("en-IN")
    : "";

  const name = income.receivedFrom || "";

  const amount = Number(income.amount || 0).toLocaleString("en-IN");

  return (
    <div className="receipt-page">

      {/* =========================
          ACTION BUTTONS
      ========================= */}

      <div className="receipt-actions">

        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <button
          className="print-button"
          onClick={() => window.print()}
        >
          🖨 Print Receipt
        </button>

        <button
          className="pdf-button"
          onClick={() => window.print()}
        >
          📄 Save PDF
        </button>

      </div>


      {/* =========================
          RECEIPT
      ========================= */}

      <div className="receipt">

        {/* IMPORTANT:
            Your actual file is Receipt.jpg.jpeg
        */}

        <img
          src="/Receipt/Receipt.jpg.jpeg"
          alt="Receipt"
          className="receipt-image"
        />


        {/* =========================
            DATE
        ========================= */}

        <div className="dynamic-date">
          {date}
        </div>


        {/* =========================
            NAME
        ========================= */}

        <div className="name-cover"></div>

        <div className="dynamic-name">
          {name}
        </div>


        {/* =========================
            CASH / AMOUNT
        ========================= */}

        <div className="dynamic-cash">

          <div className="cash-rupee">
            ₹
          </div>

          <div className="cash-content">

            <span className="cash-text">
              CASH
            </span>

            <span className="cash-amount">
              {amount}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Receipt;
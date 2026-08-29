import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import "./Receipt.css";

export default function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const receiptRef = useRef(null);

  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getIncome = async () => {
      try {
        const ref = doc(db, "income", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setIncome(snap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getIncome();
  }, [id]);

  // -----------------------------
  // FIREBASE VALUES
  // -----------------------------

  const name = income?.name || "";

  const amount = Number(income?.amount || 0);

  const formatDate = (value) => {
    if (!value) return "";

    try {
      if (value?.toDate) {
        return value.toDate().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      const d = new Date(value);

      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      return String(value);
    } catch {
      return String(value);
    }
  };

  const date = formatDate(income?.date);

  const formattedAmount = amount.toLocaleString("en-IN");

  // -----------------------------
  // PRINT
  // -----------------------------

  const printReceipt = () => {
    window.print();
  };

  // -----------------------------
  // PDF
  // -----------------------------

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const img = canvas.toDataURL("image/jpeg", 1);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const width = 210;
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(img, "JPEG", 0, 0, width, height);

      pdf.save(`Receipt-${name || "Income"}.pdf`);
    } catch (error) {
      console.error(error);
      alert("PDF download failed");
    }
  };

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
        <h2>Receipt Not Found</h2>

        <button onClick={() => navigate("/income")}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="receipt-page">

      {/* BUTTONS */}

      <div className="receipt-actions">

        <button
          className="back-button"
          onClick={() => navigate("/income")}
        >
          ← Back
        </button>

        <button
          className="print-button"
          onClick={printReceipt}
        >
          🖨 Print Receipt
        </button>

        <button
          className="pdf-button"
          onClick={downloadPDF}
        >
          📄 Download PDF
        </button>

      </div>


      {/* =================================
          ORIGINAL RECEIPT
      ================================= */}

      <div
        className="receipt"
        ref={receiptRef}
      >

        <img
          src="/receipt.jpg"
          alt="Receipt"
          className="receipt-image"
        />


        {/* =================================
            DATE
        ================================= */}

        <div className="dynamic-date">
          {date}
        </div>


        {/* =================================
            HIDE OLD NAME FROM IMAGE
        ================================= */}

        <div className="name-cover"></div>


        {/* =================================
            FIREBASE NAME
        ================================= */}

        <div className="dynamic-name">
          {name}
        </div>


        {/* =================================
            CASH BOX
        ================================= */}

        <div className="dynamic-cash">

          <div className="cash-rupee">
            ₹
          </div>

          <div className="cash-content">

            <span className="cash-text">
              CASH
            </span>

            <span className="cash-amount">
              {formattedAmount}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}
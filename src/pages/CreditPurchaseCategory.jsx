import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { db } from "../firebase/firebase";
import { useParams } from "react-router-dom";

import BackButton from "../components/BackButton";
import "./CreditPurchaseCategory.css";

function CreditPurchaseCategory() {
  const { category } = useParams();

  const categoryName =
    category.charAt(0).toUpperCase() + category.slice(1);

  const [records, setRecords] = useState([]);

  const [form, setForm] = useState({
    date: "",
    amount: "",
    type: "Cost",
  });

  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // =========================
  // LOAD RECORDS
  // =========================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "creditPurchases"),
      (snapshot) => {
        const list = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (item) =>
              item.category?.toLowerCase() ===
              category.toLowerCase()
          )
          .sort((a, b) =>
            (b.date || "").localeCompare(a.date || "")
          );

        setRecords(list);
      },
      (error) => {
        console.error("Credit Purchase Error:", error);
      }
    );

    return () => unsubscribe();
  }, [category]);

  // =========================
  // HANDLE CHANGE
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // SAVE / UPDATE
  // =========================

  const saveRecord = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!form.date || !form.amount) {
      alert("Please enter Date and Amount");
      return;
    }

    setSaving(true);

    try {
      const data = {
        category: categoryName,
        date: form.date,
        amount: Number(form.amount),
        type: form.type,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "creditPurchases", editingId),
          data
        );

        alert("Record Updated Successfully");
      } else {
        await addDoc(
          collection(db, "creditPurchases"),
          {
            ...data,
            createdAt: new Date(),
          }
        );

        alert("Record Saved Successfully");
      }

      resetForm();

    } catch (error) {
      console.error(error);
      alert("Error Saving Record");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT
  // =========================

  const startEdit = (item) => {
    setEditingId(item.id);

    setForm({
      date: item.date || "",
      amount: item.amount || "",
      type: item.type || "Cost",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE
  // =========================

  const deleteRecord = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(db, "creditPurchases", id)
      );

      alert("Record Deleted Successfully");

    } catch (error) {
      console.error(error);
      alert("Error Deleting Record");
    }
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      date: "",
      amount: "",
      type: "Cost",
    });
  };

  // =========================
  // TOTAL COST
  // =========================

  const totalCost = records.reduce(
    (total, item) => {
      if (item.type === "Cost") {
        return total + Number(item.amount || 0);
      }

      return total;
    },
    0
  );

  // =========================
  // TOTAL INCOME
  // =========================

  const totalIncome = records.reduce(
    (total, item) => {
      if (item.type === "Income") {
        return total + Number(item.amount || 0);
      }

      return total;
    },
    0
  );

  // =========================
  // PENDING BALANCE
  // =========================

  const pendingBalance =
    totalCost - totalIncome;

  // =========================
  // DOWNLOAD PDF
  // =========================

  const downloadPDF = () => {
    if (records.length === 0) {
      alert("No records available");
      return;
    }

    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
      `${categoryName} Credit Purchase Report`,
      14,
      20
    );

    pdf.setFontSize(11);

    pdf.text(
      `Total Cost: Rs. ${totalCost.toLocaleString(
        "en-IN"
      )}`,
      14,
      30
    );

    pdf.text(
      `Total Income: Rs. ${totalIncome.toLocaleString(
        "en-IN"
      )}`,
      14,
      37
    );

    pdf.text(
      `Pending Balance: Rs. ${pendingBalance.toLocaleString(
        "en-IN"
      )}`,
      14,
      44
    );

    autoTable(pdf, {
      startY: 52,

      head: [
        [
          "Date",
          "Amount",
          "Type",
        ],
      ],

      body: records.map((item) => [
        item.date || "-",

        `Rs. ${Number(
          item.amount || 0
        ).toLocaleString("en-IN")}`,

        item.type || "-",
      ]),

      styles: {
        fontSize: 10,
      },

      headStyles: {
        fillColor: [23, 32, 51],
      },
    });

    pdf.save(
      `${categoryName}-Credit-Purchase-Report.pdf`
    );
  };

  // =========================
  // DOWNLOAD EXCEL
  // =========================

  const downloadExcel = () => {
    if (records.length === 0) {
      alert("No records available");
      return;
    }

    const data = records.map((item) => ({
      Date: item.date || "",
      Category: item.category || "",
      Amount: Number(item.amount || 0),
      Type: item.type || "",
    }));

    data.push({
      Date: "",
      Category: "",
      Amount: "",
      Type: "",
    });

    data.push({
      Date: "Total Cost",
      Category: "",
      Amount: totalCost,
      Type: "",
    });

    data.push({
      Date: "Total Income",
      Category: "",
      Amount: totalIncome,
      Type: "",
    });

    data.push({
      Date: "Pending Balance",
      Category: "",
      Amount: pendingBalance,
      Type: "",
    });

    const worksheet =
      XLSX.utils.json_to_sheet(data);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      categoryName.substring(0, 31)
    );

    XLSX.writeFile(
      workbook,
      `${categoryName}-Credit-Purchase-Report.xlsx`
    );
  };

  return (
    <div className="credit-category-page">

      {/* BACK */}

      <BackButton />

      {/* HEADER */}

      <div className="category-header">

        <div>
          <h2>{categoryName}</h2>

          <p>
            Credit Purchase Records
          </p>
        </div>

        <div className="category-pending">

          <span>
            Pending Balance
          </span>

          <strong>
            ₹{" "}
            {pendingBalance.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="summary-cards">

        <div className="summary-card cost-card">

          <span>
            Total Cost
          </span>

          <strong>
            ₹{" "}
            {totalCost.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

        <div className="summary-card income-card">

          <span>
            Total Income
          </span>

          <strong>
            ₹{" "}
            {totalIncome.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

        <div className="summary-card pending-card">

          <span>
            Pending Balance
          </span>

          <strong>
            ₹{" "}
            {pendingBalance.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

      </div>

      {/* FORM */}

      <div className="credit-form-card">

        <h3>
          {editingId
            ? `Edit ${categoryName}`
            : `Add ${categoryName}`}
        </h3>

        <form onSubmit={saveRecord}>

          <div className="form-grid">

            {/* DATE */}

            <div>

              <label>
                Date
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

            </div>

            {/* AMOUNT */}

            <div>

              <label>
                Amount
              </label>

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                min="1"
                value={form.amount}
                onChange={handleChange}
                required
              />

            </div>

            {/* TYPE */}

            <div>

              <label>
                Type
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >

                <option value="Cost">
                  Cost
                </option>

                <option value="Income">
                  Income
                </option>

              </select>

            </div>

          </div>

          <div className="form-buttons">

            <button
              type="submit"
              className="save-credit-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update"
                : "Save"}
            </button>

            {editingId && (

              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>

            )}

          </div>

        </form>

      </div>

      {/* RECORDS */}

      <div className="credit-records-card">

        <div className="records-header">

          <div>

            <h3>
              {categoryName} Records
            </h3>

            <p>
              {records.length} record
              {records.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          <div className="download-buttons">

            <button
              className="pdf-btn"
              onClick={downloadPDF}
            >
              📄 PDF
            </button>

            <button
              className="excel-btn"
              onClick={downloadExcel}
            >
              📊 Excel
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>
                  Date
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Type
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {records.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="no-records"
                  >
                    No records found
                  </td>

                </tr>

              ) : (

                records.map((item) => (

                  <tr key={item.id}>

                    <td>
                      {item.date}
                    </td>

                    <td>
                      ₹{" "}
                      {Number(
                        item.amount || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td>

                      <span
                        className={
                          item.type ===
                          "Cost"
                            ? "cost"
                            : "income"
                        }
                      >
                        {item.type}
                      </span>

                    </td>

                    <td>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          startEdit(item)
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteRecord(
                            item.id
                          )
                        }
                      >
                        🗑 Delete
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default CreditPurchaseCategory;
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";

import BackButton from "../components/BackButton";
import "./IncomeList.css";

function IncomeList() {
  const navigate = useNavigate();

  const [income, setIncome] = useState([]);
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    date: "",
    amount: "",
    category: "",
    receivedFrom: "",
    description: "",
  });

  // =========================
  // LOAD INCOME
  // =========================

  const loadIncome = async () => {
    try {
      const snapshot = await getDocs(
        collection(db, "income")
      );

      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setIncome(list);
    } catch (error) {
      console.error(error);
      alert("Error loading income");
    }
  };

  useEffect(() => {
    loadIncome();
  }, []);

  // =========================
  // START EDIT
  // =========================

  const startEdit = (item) => {
    setEditingId(item.id);

    setEditForm({
      date: item.date || "",
      amount: item.amount || "",
      category: item.category || "",
      receivedFrom: item.receivedFrom || "",
      description: item.description || "",
    });
  };

  // =========================
  // EDIT INPUT
  // =========================

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // UPDATE INCOME
  // =========================

  const updateIncome = async (e) => {
    e.preventDefault();

    if (!editingId) return;

    try {
      await updateDoc(
        doc(db, "income", editingId),
        {
          date: editForm.date,
          amount: Number(editForm.amount),
          category: editForm.category,
          receivedFrom: editForm.receivedFrom,
          description: editForm.description,
        }
      );

      alert("Income Updated Successfully");

      setEditingId(null);

      setEditForm({
        date: "",
        amount: "",
        category: "",
        receivedFrom: "",
        description: "",
      });

      loadIncome();
    } catch (error) {
      console.error(error);
      alert("Error Updating Income");
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const cancelEdit = () => {
    setEditingId(null);

    setEditForm({
      date: "",
      amount: "",
      category: "",
      receivedFrom: "",
      description: "",
    });
  };

  // =========================
  // DELETE
  // =========================

  const deleteIncome = async (id) => {
    if (!window.confirm("Delete this income?")) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "income", id)
      );

      alert("Income Deleted");

      loadIncome();
    } catch (error) {
      console.error(error);
      alert("Error deleting income");
    }
  };

  // =========================
  // RECEIPT
  // =========================

  const openReceipt = (id) => {
    navigate(`/receipt/${id}`);
  };

  // =========================
  // SEARCH
  // =========================

  const filtered = income.filter((item) => {
    const searchText = search.toLowerCase();

    return (
      item.category
        ?.toLowerCase()
        .includes(searchText) ||

      item.receivedFrom
        ?.toLowerCase()
        .includes(searchText) ||

      item.description
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  // =========================
  // UI
  // =========================

  return (
    <div className="income-list">

      <BackButton />

      {/* =========================
          HEADER
      ========================= */}

      <div className="income-list-header">

        <div>
          <h2>Income List</h2>

          <p>
            Manage all income transactions
          </p>
        </div>

        <div className="income-count">
          Total: {filtered.length}
        </div>

      </div>

      {/* =========================
          SEARCH
      ========================= */}

      <input
        className="income-search"
        type="text"
        placeholder="Search category, name or description..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      {/* =========================
          EDIT FORM
      ========================= */}

      {editingId && (
        <div className="edit-income-card">

          <h3>✏️ Edit Income</h3>

          <form onSubmit={updateIncome}>

            <div className="edit-grid">

              {/* DATE */}

              <div>
                <label>Date</label>

                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  required
                />
              </div>

              {/* AMOUNT */}

              <div>
                <label>Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  min="1"
                  required
                />
              </div>

              {/* CATEGORY */}

              <div>
                <label>Category</label>

                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  required
                />
              </div>

              {/* RECEIVED FROM */}

              <div>
                <label>
                  Received From
                </label>

                <input
                  type="text"
                  name="receivedFrom"
                  value={editForm.receivedFrom}
                  onChange={handleEditChange}
                />
              </div>

            </div>

            {/* DESCRIPTION */}

            <div>
              <label>Description</label>

              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
              />
            </div>

            {/* EDIT ACTIONS */}

            <div className="edit-actions">

              <button
                type="submit"
                className="update-btn"
              >
                💾 Update Income
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={cancelEdit}
              >
                ✕ Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =========================
          TABLE
      ========================= */}

      <div className="income-table-wrapper">

        <table>

          <thead>

            <tr>
              <th>Date</th>
              <th>Received From</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {filtered.length === 0 ? (

              <tr>
                <td
                  colSpan="5"
                  className="no-data"
                >
                  No income found
                </td>
              </tr>

            ) : (

              filtered.map((item) => (

                <tr key={item.id}>

                  {/* DATE */}

                  <td>
                    {item.date || "-"}
                  </td>

                  {/* NAME */}

                  <td>
                    {item.receivedFrom || "-"}
                  </td>

                  {/* CATEGORY */}

                  <td>
                    {item.category || "-"}
                  </td>

                  {/* AMOUNT */}

                  <td>
                    ₹{" "}
                    {Number(
                      item.amount || 0
                    ).toLocaleString("en-IN")}
                  </td>

                  {/* ACTION */}

                  <td className="action-buttons">

                    {/* RECEIPT */}

                    <button
                      className="receipt-btn"
                      onClick={() =>
                        openReceipt(item.id)
                      }
                    >
                      🧾 Receipt
                    </button>

                    {/* EDIT */}

                    <button
                      className="edit-btn"
                      onClick={() =>
                        startEdit(item)
                      }
                    >
                      ✏️ Edit
                    </button>

                    {/* DELETE */}

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteIncome(item.id)
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
  );
}

export default IncomeList;
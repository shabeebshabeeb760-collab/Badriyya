import "./Reports.css";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { downloadReport } from "../utils/pdfReport";
import BackButton from "../components/BackButton";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import {
  FaFilePdf,
  FaSearch,
  FaTrash,
  FaEdit,
  FaFilter,
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
} from "react-icons/fa";

function Reports() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [reports, setReports] = useState([]);

  const [income, setIncome] = useState(0);

  const [expense, setExpense] = useState(0);

  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let incomeData = [];
    let expenseData = [];

    const updateReports = () => {
      let totalIncome = 0;
      let totalExpense = 0;

      let allReports = [];

      incomeData.forEach((item) => {
        totalIncome += Number(item.amount || 0);

        allReports.push({
          id: item.id,
          type: "Income",
          date: item.date,
          category: item.category,
          amount: item.amount,
          collection: "income",
        });
      });

      expenseData.forEach((item) => {
        totalExpense += Number(item.amount || 0);

        allReports.push({
          id: item.id,
          type: "Expense",
          date: item.date,
          category: item.category,
          amount: item.amount,
          collection: "expenses",
        });
      });

      allReports.sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      );

      setIncome(totalIncome);
      setExpense(totalExpense);
      setReports(allReports);
    };

    const unsubscribeIncome = onSnapshot(
      collection(db, "income"),
      (snapshot) => {
        incomeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        updateReports();
      }
    );

    const unsubscribeExpense = onSnapshot(
      collection(db, "expenses"),
      (snapshot) => {
        expenseData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        updateReports();
      }
    );

    return () => {
      unsubscribeIncome();
      unsubscribeExpense();
    };
  }, []);
    // Delete Report
  const deleteReport = async (id, collectionName) => {
    const ok = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!ok) return;

    try {
      await deleteDoc(doc(db, collectionName, id));
      alert("Record Deleted Successfully");
    } catch (error) {
      console.error(error);
      alert("Delete Failed");
    }
  };

  // Search + Date Filter
  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesFrom =
      !fromDate || item.date >= fromDate;

    const matchesTo =
      !toDate || item.date <= toDate;

    return matchesSearch && matchesFrom && matchesTo;
  });

  const balance = income - expense;

  return (
    <div className="dashboard">
  <BackButton />

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="main">

        <Header
          setOpen={setSidebarOpen}
        />

        {/* Summary Cards */}

        <div className="report-summary">

          <div className="box green">
            <FaMoneyBillWave />
            <div>
              <h3>Total Income</h3>
              <h2>₹ {income}</h2>
            </div>
          </div>

          <div className="box red">
            <FaWallet />
            <div>
              <h3>Total Expense</h3>
              <h2>₹ {expense}</h2>
            </div>
          </div>

          <div className="box blue">
            <FaChartLine />
            <div>
              <h3>Current Balance</h3>
              <h2>₹ {balance}</h2>
            </div>
          </div>

        </div>

        {/* Search + Filter */}

        <div className="report-toolbar">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search Category / Type..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <div className="date-filter">

            <FaFilter />

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
            />

            <span>To</span>

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
            />

          </div>

          <button
            className="pdf-btn"
            onClick={() =>
              downloadReport(
                filteredReports,
                income,
                expense
              )
            }
          >
            <FaFilePdf />
            &nbsp; Download PDF
          </button>

        </div>
                {/* Reports Table */}

        <div className="report-table">

          <h2>Finance Reports</h2>

          <table>

            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>

              {filteredReports.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "25px",
                    }}
                  >
                    No Reports Found
                  </td>
                </tr>

              ) : (

                filteredReports.map((item) => (

                  <tr key={item.id}>

                    <td>{item.date}</td>

                    <td>

                      <span
                        className={
                          item.type === "Income"
                            ? "income-badge"
                            : "expense-badge"
                        }
                      >
                        {item.type}
                      </span>

                    </td>

                    <td>{item.category}</td>

                    <td>
                      ₹ {Number(item.amount).toLocaleString()}
                    </td>

                    <td>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          navigate(
                            `/edit-report/${item.collection}/${item.id}`
                          )
                        }
                      >
                        <FaEdit />
                        &nbsp; Edit
                      </button>

                    </td>

                    <td>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteReport(
                            item.id,
                            item.collection
                          )
                        }
                      >
                        <FaTrash />
                        &nbsp; Delete
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

export default Reports;
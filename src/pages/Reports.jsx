import "./Reports.css";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { downloadReport } from "../utils/pdfReport";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  FaFilePdf,
  FaDownload,
  FaCalendarAlt,
  FaFilter
} from "react-icons/fa";
function Reports() {
  const [reports, setReports] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

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
          date: item.date,
          type: "Income",
          category: item.category,
          amount: item.amount,
        });
      });

      expenseData.forEach((item) => {
        totalExpense += Number(item.amount || 0);

        allReports.push({
          id: item.id,
          date: item.date,
          type: "Expense",
          category: item.category,
          amount: item.amount,
        });
      });

      allReports.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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
      collection(db, "expense"),
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

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main">
        <Header />

        <div className="report-summary">

          <div className="box green">
            <h3>Total Income</h3>
            <h2>₹ {income}</h2>
          </div>

          <div className="box red">
            <h3>Total Expense</h3>
            <h2>₹ {expense}</h2>
          </div>

          <div className="box blue">
            <h3>Current Balance</h3>
            <h2>₹ {income - expense}</h2>
          </div>

        </div>

        <div className="report-table">

          <h2>Live Finance Report</h2>
<button
  className="pdf-btn"
  onClick={() =>
    downloadReport(reports, income, expense)
  }
><button className="pdf-btn">
    <FaFilePdf />
    &nbsp; Download Monthly PDF
</button>
  Download PDF
</button>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>

              {reports.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No Reports Found
                  </td>
                </tr>
              ) : (
                reports.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.type}</td>
                    <td>{item.category}</td>
                    <td>₹ {item.amount}</td>
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
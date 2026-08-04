import "./Dashboard.css";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";

import {
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
  FaCalendarDay,
  FaReceipt,
  FaExchangeAlt,
} from "react-icons/fa";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [transactions, setTransactions] = useState(0);

  useEffect(() => {
    let incomeData = [];
    let expenseData = [];

    const updateDashboard = () => {
      const today = new Date().toISOString().split("T")[0];

      let income = 0;
      let expense = 0;
      let todayInc = 0;
      let todayExp = 0;

      incomeData.forEach((item) => {
        const amount = Number(item.amount || 0);

        income += amount;

        if (item.date === today) {
          todayInc += amount;
        }
      });

      expenseData.forEach((item) => {
        const amount = Number(item.amount || 0);

        expense += amount;

        if (item.date === today) {
          todayExp += amount;
        }
      });

      setTotalIncome(income);
      setTotalExpense(expense);
      setTodayIncome(todayInc);
      setTodayExpense(todayExp);
      setTransactions(incomeData.length + expenseData.length);
    };

    const unsubscribeIncome = onSnapshot(
      collection(db, "income"),
      (snapshot) => {
        incomeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        updateDashboard();
      }
    );

    const unsubscribeExpense = onSnapshot(
      collection(db, "expense"),
      (snapshot) => {
        expenseData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        updateDashboard();
      }
    );

    return () => {
      unsubscribeIncome();
      unsubscribeExpense();
    };
  }, []);

  const balance = totalIncome - totalExpense;

  return (
    <div className="dashboard">

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="main">

        <Header
          setOpen={setSidebarOpen}
        />

        <div className="cards">

          <DashboardCard
            title="Total Income"
            value={`₹ ${totalIncome}`}
            color="#16a34a"
            icon={<FaMoneyBillWave />}
            path="/income"
          />

          <DashboardCard
            title="Total Expense"
            value={`₹ ${totalExpense}`}
            color="#dc2626"
            icon={<FaWallet />}
            path="/expense"
          />

          <DashboardCard
            title="Current Balance"
            value={`₹ ${balance}`}
            color="#2563eb"
            icon={<FaChartLine />}
            path="/reports"
          />

          <DashboardCard
            title="Today's Income"
            value={`₹ ${todayIncome}`}
            color="#22c55e"
            icon={<FaCalendarDay />}
            path="/income"
          />

          <DashboardCard
            title="Today's Expense"
            value={`₹ ${todayExpense}`}
            color="#f97316"
            icon={<FaReceipt />}
            path="/expense"
          />

          <DashboardCard
            title="Transactions"
            value={transactions}
            color="#9333ea"
            icon={<FaExchangeAlt />}
            path="/reports"
          />

        </div>

        <div className="recent">

          <h2>Recent Transactions</h2>

          <table>

            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  Live transactions will appear here
                </td>
              </tr>
            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;
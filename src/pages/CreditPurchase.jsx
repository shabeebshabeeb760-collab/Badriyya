import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

import {
  FaCarrot,
  FaDrumstickBite,
  FaFish,
  FaShoppingBasket,
  FaBox,
  FaArrowRight,
  FaWallet,
  FaChartLine,
  FaShoppingCart,
} from "react-icons/fa";

import BackButton from "../components/BackButton";
import "./CreditPurchase.css";

function CreditPurchase() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);

  /* =========================
     FIREBASE DATA
  ========================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "creditPurchases"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRecords(list);
      },
      (error) => {
        console.error("Credit Purchase Error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================
     CATEGORIES
  ========================= */

  const categories = [
    {
      name: "Veg",
      icon: <FaCarrot />,
      color: "#16a34a",
      light: "#ecfdf5",
    },
    {
      name: "Chicken",
      icon: <FaDrumstickBite />,
      color: "#dc2626",
      light: "#fef2f2",
    },
    {
      name: "Fish",
      icon: <FaFish />,
      color: "#0284c7",
      light: "#f0f9ff",
    },
    {
      name: "Groceries",
      icon: <FaShoppingBasket />,
      color: "#d97706",
      light: "#fffbeb",
    },
    {
      name: "Other",
      icon: <FaBox />,
      color: "#64748b",
      light: "#f8fafc",
    },
  ];

  /* =========================
     TOTAL COST
  ========================= */

  const totalCost = useMemo(() => {
    return records
      .filter((item) => item.type === "Cost")
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [records]);

  /* =========================
     TOTAL INCOME
  ========================= */

  const totalIncome = useMemo(() => {
    return records
      .filter((item) => item.type === "Income")
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [records]);

  /* =========================
     TOTAL PENDING
  ========================= */

  const totalPending = totalCost - totalIncome;

  /* =========================
     CATEGORY TOTALS
  ========================= */

  const getCategoryRecords = (category) => {
    return records.filter(
      (item) =>
        item.category?.toLowerCase() ===
        category.toLowerCase()
    );
  };

  const getCost = (category) => {
    return getCategoryRecords(category).reduce(
      (total, item) => {
        if (item.type === "Cost") {
          return total + Number(item.amount || 0);
        }

        return total;
      },
      0
    );
  };

  const getIncome = (category) => {
    return getCategoryRecords(category).reduce(
      (total, item) => {
        if (item.type === "Income") {
          return total + Number(item.amount || 0);
        }

        return total;
      },
      0
    );
  };

  const getPending = (category) => {
    return (
      getCost(category) -
      getIncome(category)
    );
  };

  /* =========================
     MONEY FORMAT
  ========================= */

  const money = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

  /* =========================
     OPEN CATEGORY
  ========================= */

  const openCategory = (category) => {
    navigate(
      `/credit-purchase/${category.toLowerCase()}`
    );
  };

  return (
    <div className="credit-purchase-page">

      {/* =========================
          TOP AREA
      ========================= */}

      <div className="credit-top">

        <BackButton />

        <div className="credit-header">

          <div className="credit-title">

            <div className="credit-title-icon">
              <FaWallet />
            </div>

            <div>
              <h1>Credit Purchase</h1>

              <p>
                Manage and monitor all credit
                purchase transactions
              </p>
            </div>

          </div>

          {/* TOTAL PENDING */}

          <div className="total-pending-card">

            <div className="total-pending-icon">
              <FaWallet />
            </div>

            <div>
              <span>Total Pending</span>

              <strong>
                {money(totalPending)}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* =========================
          OVERVIEW
      ========================= */}

      <div className="credit-overview">

        {/* COST */}

        <div className="overview-card">

          <div className="overview-icon cost">
            <FaShoppingCart />
          </div>

          <div>
            <span>Total Cost</span>

            <h2>
              {money(totalCost)}
            </h2>

            <p>
              Total credit purchases
            </p>
          </div>

        </div>

        {/* INCOME */}

        <div className="overview-card">

          <div className="overview-icon income">
            <FaChartLine />
          </div>

          <div>
            <span>Total Income</span>

            <h2>
              {money(totalIncome)}
            </h2>

            <p>
              Total payments received
            </p>
          </div>

        </div>

        {/* PENDING */}

        <div className="overview-card">

          <div className="overview-icon pending">
            <FaWallet />
          </div>

          <div>
            <span>Pending Balance</span>

            <h2>
              {money(totalPending)}
            </h2>

            <p>
              Outstanding amount
            </p>
          </div>

        </div>

      </div>

      {/* =========================
          CATEGORY TITLE
      ========================= */}

      <div className="category-section-header">

        <div>
          <h2>Purchase Categories</h2>

          <p>
            Select a category to view complete
            transaction details
          </p>
        </div>

        <span>
          {categories.length} Categories
        </span>

      </div>

      {/* =========================
          CATEGORY CARDS
      ========================= */}

      <div className="credit-cards">

        {categories.map((category) => {

          const cost = getCost(category.name);
          const income = getIncome(category.name);
          const pending = cost - income;

          return (
            <div
              className="credit-card"
              key={category.name}
              onClick={() =>
                openCategory(category.name)
              }
            >

              {/* TOP */}

              <div className="card-top">

                <div
                  className="credit-icon"
                  style={{
                    background: category.light,
                    color: category.color,
                  }}
                >
                  {category.icon}
                </div>

                <div
                  className="card-arrow"
                  style={{
                    color: category.color,
                    background: category.light,
                  }}
                >
                  <FaArrowRight />
                </div>

              </div>

              {/* NAME */}

              <div className="card-title">

                <h3>{category.name}</h3>

                <span>
                  Credit Purchase
                </span>

              </div>

              {/* PENDING */}

              <div className="card-pending">

                <div>
                  <span>Pending Balance</span>

                  <strong>
                    {money(pending)}
                  </strong>
                </div>

                <div
                  className="pending-mini-icon"
                  style={{
                    background: category.light,
                    color: category.color,
                  }}
                >
                  <FaWallet />
                </div>

              </div>

              {/* BOTTOM STATS */}

              <div className="card-stats">

                <div className="card-stat">

                  <span>Cost</span>

                  <strong>
                    {money(cost)}
                  </strong>

                </div>

                <div className="stat-divider"></div>

                <div className="card-stat">

                  <span>Income</span>

                  <strong>
                    {money(income)}
                  </strong>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default CreditPurchase;
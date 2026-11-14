import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import IncomeList from "./pages/IncomeList";
import Expense from "./pages/Expense";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CreditPurchase from "./pages/CreditPurchase";
import CreditPurchaseCategory from "./pages/CreditPurchaseCategory";
import Receipt from "./pages/Receipt";
import CalendarSales from "./pages/CalendarSales";
import CalendarSalesDashboard from "./pages/CalendarSalesDashboard";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
 <Route path="/calendar-sales" element={<CalendarSales />} />
<Route path="/receipt/:id" element={<Receipt />} />
      <Route path="/income" element={<Income />} />
      <Route path="/income/list" element={<IncomeList />} />
      <Route
  path="/credit-purchase"
  element={<CreditPurchase />}
/>
<Route
  path="/calendar-sales-dashboard"
  element={<CalendarSalesDashboard />}
/>
<Route
  path="/credit-purchase/:category"
  element={<CreditPurchaseCategory />}
/>

      <Route path="/expense" element={<Expense />} />

      <Route path="/reports" element={<Reports />} />

      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
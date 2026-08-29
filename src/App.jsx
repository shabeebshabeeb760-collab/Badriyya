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
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
 

      <Route path="/income" element={<Income />} />
      <Route path="/income/list" element={<IncomeList />} />
      <Route
  path="/credit-purchase"
  element={<CreditPurchase />}
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
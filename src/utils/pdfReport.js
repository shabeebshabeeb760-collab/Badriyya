import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadReport = (reports, income, expense) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("BADRIYYA Finance Report", 14, 20);

  doc.setFontSize(12);
  doc.text(`Total Income : ₹ ${income}`, 14, 35);
  doc.text(`Total Expense : ₹ ${expense}`, 14, 43);
  doc.text(`Balance : ₹ ${income - expense}`, 14, 51);

  autoTable(doc, {
    startY: 60,
    head: [["Date", "Type", "Category", "Amount"]],
    body: reports.map((r) => [
      r.date,
      r.type,
      r.category,
      `₹ ${r.amount}`,
    ]),
  });

  doc.save("Finance_Report.pdf");
};

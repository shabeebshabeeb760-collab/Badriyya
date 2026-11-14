export const downloadReport = async (reports, income, expense) => {
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
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
  } catch (error) {
    console.error("Finance PDF generation failed:", error);
    window.alert("Could not create the PDF report. Please try again.");
  }
};
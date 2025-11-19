import PDFDocument from "pdfkit";

const GOLD = "#d4a138";
const DARK = "#111827";
const TEXT = "#374151";

export function generatePdfFromAnalysis(res, analysisData) {
  try {
    const { title, score, analysis_json, profilEntreprise } = analysisData;

    const doc = new PDFDocument({
      autoFirstPage: false,
      margins: { top: 60, bottom: 50, left: 55, right: 55 }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "analyse"}.pdf"`
    );

    doc.pipe(res);

    // Footer simple sans boucle
    const addFooter = () => {
      const y = doc.page.height - 40;
      doc.fontSize(9).fillColor("#6b7280")
        .text("MyMír — Rapport confidentiel © 2025", 55, y, { align: "left" })
        .text(`Page ${doc.bufferedPageRange().count}`, 0, y, { align: "right" });
    };

    // =====================================================
    // PAGE 1 - COUVERTURE
    // =====================================================
    doc.addPage();
    doc.fontSize(28).fillColor(GOLD).text("MyMír", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(20).fillColor(DARK).text("Rapport d'analyse d'appel d'offres", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).fillColor(TEXT).text(`📌 ${title || "Sans titre"}`, { align: "center" });
    doc.moveDown(1);
    doc.fontSize(12).fillColor(TEXT).text(
      `🕒 Généré le : ${new Date().toLocaleString("fr-FR")}`,
      { align: "center" }
    );
    doc.moveDown(2);
    doc.fontSize(26)
      .fillColor(score >= 70 ? "#16a34a" : score >= 40 ? "#facc15" : "#dc2626")
      .text(`Score : ${score || 0} / 100`, { align: "center" });
    doc.moveDown(2);
    doc.strokeColor(GOLD).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    addFooter();

    // =====================================================
    // PAGE 2 - PROFIL ENTREPRISE
    // =====================================================
    doc.addPage();
    doc.fontSize(18).fillColor(GOLD).text("📂 Profil de l'entreprise");
    doc.moveDown(1);
    doc.fontSize(11).fillColor(TEXT);

    if (profilEntreprise && typeof profilEntreprise === 'object') {
      Object.entries(profilEntreprise).forEach(([key, value]) => {
        if (value && value !== '—') {
          doc.text(`• ${key} : ${value}`);
        }
      });
    } else {
      doc.text("Aucune donnée");
    }
    addFooter();

    // =====================================================
    // FONCTION AFFICHAGE RÉCURSIF
    // =====================================================
    const renderData = (obj, indent = 0) => {
      if (!obj) return;
      
      const prefix = "  ".repeat(indent);
      
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (typeof item === 'string') {
            doc.text(`${prefix}• ${item}`);
          } else {
            renderData(item, indent);
          }
        });
      } else if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          if (!value) return;
          
          if (typeof value === 'string' || typeof value === 'number') {
            doc.text(`${prefix}• ${key} : ${value}`);
          } else if (Array.isArray(value)) {
            doc.fontSize(12).fillColor(GOLD).text(`${prefix}${key} :`);
            doc.fontSize(11).fillColor(TEXT);
            renderData(value, indent + 1);
          } else if (typeof value === 'object') {
            doc.fontSize(12).fillColor(GOLD).text(`${prefix}${key} :`);
            doc.fontSize(11).fillColor(TEXT);
            renderData(value, indent + 1);
          }
        });
      } else {
        doc.text(`${prefix}${obj}`);
      }
    };

    // =====================================================
    // CONTENU COMPLET DE L'ANALYSE
    // =====================================================
    if (analysis_json && Object.keys(analysis_json).length > 0) {
      doc.addPage();
      doc.fontSize(18).fillColor(GOLD).text("📊 Analyse complète");
      doc.moveDown(1);
      doc.fontSize(11).fillColor(TEXT);
      
      renderData(analysis_json);
      addFooter();
    } else {
      doc.addPage();
      doc.fontSize(14).fillColor(TEXT).text("Aucune donnée d'analyse disponible");
      addFooter();
    }

    // =====================================================
    // FINALISATION
    // =====================================================
    doc.end();

  } catch (err) {
    console.error("❌ Erreur PDF :", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Erreur génération PDF" });
    }
  }
}

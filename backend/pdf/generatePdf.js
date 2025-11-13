// =====================================================
// 📄 MyMír — Générateur PDF PREMIUM (PDFKit)
// =====================================================

import PDFDocument from "pdfkit";

// Couleurs officielles MyMír
const GOLD = "#d4a138";
const DARK = "#111827";
const TEXT = "#374151";

export function generatePdfFromAnalysis(res, analysisData) {
  const { title, score, summary, analysis_json, profilEntreprise } = analysisData;

  // === Initialisation du document A4
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 50, left: 50, right: 50 }
  });

  // En-têtes HTTP
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title?.replace(/[^a-zA-Z0-9]/g, "_") || "analyse"}.pdf"`
  );

  doc.pipe(res);

  // =====================================================
  // 🟦 PAGE DE GARDE
  // =====================================================

  doc.fontSize(28).fillColor(GOLD).text("MyMír", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(20).fillColor(DARK).text("Rapport d’analyse d’appel d’offres", {
    align: "center",
  });

  doc.moveDown(2);
  doc.fontSize(16).fillColor(TEXT).text(`📌 ${title || "Sans titre"}`, {
    align: "center",
  });

  doc.moveDown(1);
  doc
    .fontSize(12)
    .fillColor(TEXT)
    .text(`🕒 Généré le : ${new Date().toLocaleString("fr-FR")}`, {
      align: "center",
    });

  doc.moveDown(2);
  doc
    .fontSize(26)
    .fillColor(score >= 70 ? "#16a34a" : score >= 40 ? "#facc15" : "#dc2626")
    .text(`Score : ${score || "--"} / 100`, { align: "center" });

  doc.moveDown(2);
  doc.strokeColor(GOLD).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.addPage();

  // =====================================================
  // 🟧 PROFIL ENTREPRISE
  // =====================================================

  doc.fontSize(18).fillColor(GOLD).text("📂 Profil de l’entreprise");
  doc.moveDown(1);

  if (profilEntreprise) {
    doc.fontSize(12).fillColor(TEXT);

    Object.entries(profilEntreprise).forEach(([key, value]) => {
      doc.text(`• ${key} : ${value}`);
    });
  } else {
    doc.fontSize(12).fillColor(TEXT).text("Aucun profil renseigné.");
  }

  doc.moveDown(2);

  // Fonction utilitaire pour écrire une section
  const section = (titre, contenu) => {
    doc.moveDown(1);
    doc.fontSize(16).fillColor(GOLD).text(titre);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(TEXT);

    if (!contenu || contenu.length === 0) {
      doc.text("—");
      return;
    }

    if (Array.isArray(contenu)) {
      contenu.forEach((item) => doc.text(`• ${item}`));
    } else if (typeof contenu === "object") {
      Object.entries(contenu).forEach(([k, v]) => doc.text(`• ${k} : ${v}`));
    } else {
      doc.text(String(contenu));
    }
  };

  // =====================================================
  // 🟨 SECTIONS JSON
  // =====================================================

  section("🏛️ Identité du marché", {
    "Type de marché": analysis_json.type_marche,
    "Autorité": analysis_json.autorite,
    "Date limite": analysis_json.date_limite,
    "Contexte": analysis_json.contexte,
  });

  section("📑 Documents requis", analysis_json.documents_requis);
  section("📊 Analyse du profil entreprise", analysis_json.analyse_profil);
  section("💡 Recommandations", analysis_json.recommandations);
  section("📅 Plan de dépôt", analysis_json.plan_de_depot);
  section("📝 Checklist finale", analysis_json.checklist);

  section("🎯 Score final", `${analysis_json.score || "--"} / 100`);

  // =====================================================
  // 🟥 PIED DE PAGE OFFICIEL
  // =====================================================

  const addFooter = (doc) => {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text("MyMír — Rapport confidentiel © 2025", 50, doc.page.height - 40, {
          align: "left",
        });

      doc.text(`Page ${i + 1}`, -50, doc.page.height - 40, { align: "right" });
    }
  };

  addFooter(doc);

  doc.end();
}

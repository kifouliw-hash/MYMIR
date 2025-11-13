// =====================================================
// 📄 MyMír — Générateur PDF PREMIUM (PDFKit)
// =====================================================

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// === Degradé or MyMír
const GOLD = "#d4a138";
const DARK = "#111827";
const TEXT = "#374151";

/**
 * Génère un PDF premium basé sur les données d’analyse
 */
export function generatePdfFromAnalysis(res, analysisData) {
  const { title, score, summary, analysis_json } = analysisData;

  // === Initialisation du document
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 50, left: 50, right: 50 }
  });

  // === En-têtes HTTP pour le download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
  );

  // Pipe direct vers la réponse HTTP
  doc.pipe(res);

  // =====================================================
  // 🟦 1) PAGE DE GARDE PREMIUM
  // =====================================================

  doc
    .fontSize(28)
    .fillColor(GOLD)
    .text("MyMír", { align: "center" });

  doc.moveDown(2);

  doc
    .fontSize(20)
    .fillColor(DARK)
    .text("Rapport d'analyse d’Appel d’Offres", { align: "center" });

  doc.moveDown(2);

  doc
    .fontSize(16)
    .fillColor(TEXT)
    .text(`📌 ${title}`, { align: "center" });

  doc.moveDown(1);

  doc
    .fontSize(12)
    .fillColor(TEXT)
    .text(`🕒 Généré le : ${new Date().toLocaleString("fr-FR")}`, { align: "center" });

  // === Score visuel
  doc.moveDown(2);
  doc
    .fontSize(26)
    .fillColor(score >= 70 ? "#16a34a" : score >= 40 ? "#facc15" : "#dc2626")
    .text(`Score : ${score || "--"} / 100`, { align: "center" });

  // === Ligne séparatrice
  doc.moveDown(3);
  doc
    .strokeColor(GOLD)
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.addPage();

  // =====================================================
  // 🟧 2) PROFIL ENTREPRISE (tiré du JSON serveur)
  // =====================================================

  doc
    .fontSize(18)
    .fillColor(GOLD)
    .text("📂 Profil de l’entreprise");

  doc.moveDown(1);
  doc.fontSize(12).fillColor(TEXT);

  if (analysis_json?.profil_entreprise) {
    const p = analysis_json.profil_entreprise;
    const keys = Object.keys(p);

    keys.forEach((k) => {
      doc.text(`• ${k} : ${p[k]}`);
    });
  } else {
    doc.text("Aucun profil entreprise renseigné.");
  }

  doc.moveDown(2);

  // =====================================================
  // 🟨 3) SECTIONS DU DOCUMENT JSON
  // =====================================================

  const writeSection = (title, content) => {
    doc
      .moveDown(1)
      .fontSize(16)
      .fillColor(GOLD)
      .text(title);

    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(TEXT);

    if (!content) {
      doc.text("—");
      return;
    }

    if (Array.isArray(content)) {
      content.forEach((item) => doc.text(`• ${item}`));
    } else if (typeof content === "object") {
      Object.entries(content).forEach(([k, v]) =>
        doc.text(`• ${k} : ${v}`)
      );
    } else {
      doc.text(String(content));
    }
  };

  writeSection("🏛️ Identité du marché", {
    "Type": analysis_json.type_marche,
    "Autorité": analysis_json.autorite,
    "Date limite": analysis_json.date_limite,
    "Contexte": analysis_json.contexte
  });

  writeSection("📑 Documents requis", analysis_json.documents_requis);
  writeSection("📊 Analyse du profil entreprise", analysis_json.analyse_profil);
  writeSection("💡 Recommandations", analysis_json.recommandations);
  writeSection("📅 Plan de dépôt", analysis_json.plan_de_depot);
  writeSection("📝 Checklist", analysis_json.checklist);
  writeSection("🎯 Score final", `${analysis_json.score || "--"} / 100`);

  // =====================================================
  // 🟥 4) PIED DE PAGE — OFFICIEL MYMÍR
  // =====================================================
  const addFooter = (doc) => {
    const range = doc.bufferedPageRange(); // toutes les pages
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text("MyMír — Rapport confidentiel © 2025", 50, doc.page.height - 40, {
          align: "left",
        });

      doc.text(`Page ${i + 1}`, -50, doc.page.height - 40, {
        align: "right",
      });
    }
  };

  addFooter(doc);

  // Finish
  doc.end();
}

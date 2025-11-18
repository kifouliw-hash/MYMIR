import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const fontPath = path.join(__dirname, "fonts", "Inter", "static", "Inter_24pt-Regular.ttf");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "analyse"}.pdf"`
    );

    doc.pipe(res);

    // 🔥 CORRECTION : Empêcher la boucle infinie
    let isAddingFooter = false;

    const addFooterToCurrentPage = () => {
      if (isAddingFooter) return;
      
      isAddingFooter = true;
      const y = doc.page.height - 40;
      
      doc.fontSize(10)
        .fillColor("#6b7280")
        .text("MyMír — Rapport confidentiel © 2025", 55, y, { 
          align: "left",
          lineBreak: false
        });

      doc.text(`Page ${doc.pageNumber}`, 0, y, { 
        align: "right",
        lineBreak: false
      });
      
      isAddingFooter = false;
    };

    doc.on("pageAdded", () => {
      if (!isAddingFooter) {
        doc.font(fontPath);
        addFooterToCurrentPage();
      }
    });

    // =====================================================
    // PAGE 1 - COUVERTURE
    // =====================================================
    doc.addPage();
    doc.font(fontPath);
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
      .text(`Score : ${score || "--"} / 100`, { align: "center" });
    doc.moveDown(2);
    doc.strokeColor(GOLD).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    // =====================================================
    // PAGE 2 - PROFIL ENTREPRISE
    // =====================================================
    doc.addPage();
    doc.fontSize(18).fillColor(GOLD).text("📂 Profil de l'entreprise");
    doc.moveDown(1);
    doc.fontSize(12).fillColor(TEXT);

    if (profilEntreprise && typeof profilEntreprise === 'object') {
      Object.entries(profilEntreprise).forEach(([key, value]) => {
        if (value && value !== '—') {
          doc.text(`• ${key} : ${value}`);
        }
      });
    } else {
      doc.text("—");
    }

    // =====================================================
    // FONCTIONS UTILITAIRES
    // =====================================================
    const section = (titre, contenu) => {
      doc.moveDown(1);
      doc.fontSize(16).fillColor(GOLD).text(titre);
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor(TEXT);

      if (!contenu || (Array.isArray(contenu) && contenu.length === 0)) {
        doc.text("—");
        return;
      }

      if (Array.isArray(contenu)) {
        contenu.forEach((item) => {
          if (item) doc.text(`• ${item}`);
        });
      } else if (typeof contenu === "object") {
        renderObject(contenu);
      } else {
        doc.text(String(contenu));
      }
    };

    const renderObject = (obj, indent = 0) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const prefix = "  ".repeat(indent);
        
        if (value === null || value === undefined || value === '') {
          return;
        }

        if (Array.isArray(value)) {
          doc.text(`${prefix}${key} :`);
          value.forEach((item) => {
            if (item) doc.text(`${prefix}  • ${item}`);
          });
        } else if (typeof value === "object") {
          doc.text(`${prefix}${key} :`);
          renderObject(value, indent + 1);
        } else {
          doc.text(`${prefix}• ${key} : ${value}`);
        }
      });
    };

    // =====================================================
    // CONTENU DU RAPPORT
    // =====================================================
    
    if (analysis_json) {
      // Identité du marché
      section("🏛️ Identité du marché", {
        "Type de marché": analysis_json.type_marche,
        "Autorité": analysis_json.autorite,
        "Date limite": analysis_json.date_limite,
        "Contexte": analysis_json.contexte
      });

      // Documents requis
      if (analysis_json.documents_requis) {
        section("📑 Documents requis", analysis_json.documents_requis);
      }

      // Analyse du profil
      if (analysis_json.analyse_profil) {
        section("📊 Analyse du profil entreprise", analysis_json.analyse_profil);
      }

      // Recommandations
      if (analysis_json.recommandations) {
        if (typeof analysis_json.recommandations === 'object' && !Array.isArray(analysis_json.recommandations)) {
          const recosArray = Object.values(analysis_json.recommandations).filter(v => v);
          section("💡 Recommandations", recosArray);
        } else {
          section("💡 Recommandations", analysis_json.recommandations);
        }
      }

      // Plan de dépôt
      if (analysis_json.plan_de_depot) {
        section("📅 Plan de dépôt", analysis_json.plan_de_depot);
      }

      // Checklist
      if (analysis_json.checklist) {
        section("📝 Checklist finale", analysis_json.checklist);
      }

      // Opportunité
      if (analysis_json.opportunity || analysis_json.opportunite) {
        section("💡 Opportunité", analysis_json.opportunity || analysis_json.opportunite);
      }

      // Score final
      section("🎯 Score final", `${analysis_json.score || score || "--"} / 100`);
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

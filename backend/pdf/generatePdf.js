import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLD = "#d4a138";
const DARK = "#1a202c";
const TEXT = "#2d3748";
const GRAY = "#718096";

export function generatePdfFromAnalysis(res, analysisData) {
  try {
    const { title, score, analysis_json, profilEntreprise } = analysisData;

    // Parse analysis
    let parsedAnalysis = {};
    try {
      if (typeof analysis_json === "string") {
        const cleanJson = analysis_json.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedAnalysis = JSON.parse(cleanJson);
      } else {
        parsedAnalysis = analysis_json;
      }
    } catch {
      parsedAnalysis = {};
    }

    const doc = new PDFDocument({
      margins: { top: 40, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });

    // NOM DU FICHIER CORRIGÉ
    const sanitizedTitle = (title || "Rapport")
      .replace(/[^a-zA-Z0-9\sÀ-ÿ-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Rapport-${sanitizedTitle}.pdf"`);

    doc.pipe(res);

    // Footer
    const addFooter = () => {
      const footerY = doc.page.height - 35;
      doc.fontSize(9).fillColor(GRAY);
      doc.text("MyMír — Rapport confidentiel © 2025", 50, footerY, { width: doc.page.width - 100, align: "left", lineBreak: false });
      doc.text(`Page ${doc.bufferedPageRange().start + 1}`, 50, footerY, { width: doc.page.width - 100, align: "right", lineBreak: false });
    };

    // ========== PAGE 1 - COUVERTURE ==========
    doc.fontSize(38).fillColor(GOLD).text("MyMír", { align: "center" });
    doc.moveDown(0.4);
    
    doc.fontSize(20).fillColor(DARK).text("Rapport d'Analyse d'Appel d'Offres", { align: "center" });
    doc.moveDown(1.8);

    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
    doc.moveDown(1.8);

    doc.fontSize(15).fillColor(TEXT).text(`${title || "Sans titre"}`, { align: "center" });
    doc.moveDown(0.6);
    doc.fontSize(11).fillColor(GRAY).text(`Généré le : ${new Date().toLocaleString("fr-FR")}`, { align: "center" });
    doc.moveDown(2.5);

    // Score
    const scoreColor = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
    doc.fontSize(46).fillColor(scoreColor).text(`Score : ${score}/100`, { align: "center" });
    doc.moveDown(3);

    // PROFIL ENTREPRISE
    doc.fontSize(18).fillColor(GOLD).text("Profil de l'Entreprise", { underline: true });
    doc.moveDown(0.6);

    if (profilEntreprise) {
      doc.fontSize(11).fillColor(TEXT);
      if (profilEntreprise.companyName) doc.text(`• Entreprise : ${profilEntreprise.companyName}`);
      if (profilEntreprise.sector) doc.text(`• Secteur : ${profilEntreprise.sector}`);
      if (profilEntreprise.effectif) doc.text(`• Effectif : ${profilEntreprise.effectif}`);
      if (profilEntreprise.revenue) doc.text(`• Chiffre d'affaires : ${profilEntreprise.revenue}`);
      if (profilEntreprise.country) doc.text(`• Pays : ${profilEntreprise.country}`);
    }

    addFooter();

    // ========== PAGE 2 - DÉTAILS + DOCUMENTS ==========
    doc.addPage();
    doc.fontSize(18).fillColor(GOLD).text("Détails du Marché", { underline: true });
    doc.moveDown(0.6);
    doc.fontSize(11).fillColor(TEXT);

    if (parsedAnalysis.type_marche) doc.text(`• Type : ${parsedAnalysis.type_marche}`);
    if (parsedAnalysis.autorite) doc.text(`• Autorité : ${parsedAnalysis.autorite}`);
    if (parsedAnalysis.date_limite) doc.text(`• Date limite : ${parsedAnalysis.date_limite}`);
    
    if (parsedAnalysis.contexte) {
      doc.moveDown(0.4);
      doc.text(`Contexte : ${parsedAnalysis.contexte}`, { align: "justify" });
    }
    doc.moveDown(1.5);

    // Documents Requis
    if (parsedAnalysis.documents_requis && Array.isArray(parsedAnalysis.documents_requis) && parsedAnalysis.documents_requis.length > 0) {
      doc.fontSize(16).fillColor(GOLD).text("Documents Requis", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(TEXT);
      parsedAnalysis.documents_requis.forEach(doc_item => {
        doc.text(`  • ${doc_item}`);
      });
      doc.moveDown(1.5);
    }

    // Certifications requises
    if (parsedAnalysis.certifications_requises && Array.isArray(parsedAnalysis.certifications_requises) && parsedAnalysis.certifications_requises.length > 0) {
      doc.fontSize(16).fillColor(GOLD).text("Certifications Requises", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(TEXT);
      parsedAnalysis.certifications_requises.forEach(cert => {
        doc.text(`  • ${cert}`);
      });
    }

    addFooter();

    // ========== PAGE 3 - ANALYSE PROFIL ==========
    if (parsedAnalysis.analyse_profil) {
      doc.addPage();
      doc.fontSize(18).fillColor(GOLD).text("Analyse du Profil", { underline: true });
      doc.moveDown(0.6);

      const analyse = parsedAnalysis.analyse_profil;

      if (analyse.points_forts && Array.isArray(analyse.points_forts) && analyse.points_forts.length > 0) {
        doc.fontSize(14).fillColor("#10b981").text("✓ Points Forts");
        doc.moveDown(0.4);
        doc.fontSize(11).fillColor(TEXT);
        analyse.points_forts.forEach(point => {
          doc.text(`  • ${point}`);
        });
        doc.moveDown(1);
      }

      if (analyse.points_faibles && Array.isArray(analyse.points_faibles) && analyse.points_faibles.length > 0) {
        doc.fontSize(14).fillColor("#ef4444").text("✗ Points Faibles");
        doc.moveDown(0.4);
        doc.fontSize(11).fillColor(TEXT);
        analyse.points_faibles.forEach(point => {
          doc.text(`  • ${point}`);
        });
        doc.moveDown(1);
      }

      if (analyse.ressources_a_mobiliser && Array.isArray(analyse.ressources_a_mobiliser) && analyse.ressources_a_mobiliser.length > 0) {
        doc.fontSize(14).fillColor(GOLD).text("Ressources à Mobiliser");
        doc.moveDown(0.4);
        doc.fontSize(11).fillColor(TEXT);
        analyse.ressources_a_mobiliser.forEach(res => {
          doc.text(`  • ${res}`);
        });
        doc.moveDown(1);
      }

      if (analyse.compatibilite) {
        doc.fontSize(14).fillColor(GOLD).text("Compatibilité");
        doc.moveDown(0.4);
        doc.fontSize(11).fillColor(TEXT);
        const comp = analyse.compatibilite;
        if (comp.geographique) doc.text(`  • Géographique : ${comp.geographique}`);
        if (comp.technique) doc.text(`  • Technique : ${comp.technique}`);
        if (comp.financiere) doc.text(`  • Financière : ${comp.financiere}`);
        if (comp.temporelle) doc.text(`  • Temporelle : ${comp.temporelle}`);
      }

      addFooter();
    }

    // ========== PAGE 4 - RECOMMANDATIONS + PLAN ==========
    doc.addPage();
    
    if (parsedAnalysis.recommendations) {
      doc.fontSize(18).fillColor(GOLD).text("Recommandations", { underline: true });
      doc.moveDown(0.6);
      doc.fontSize(11).fillColor(TEXT);

      const reco = parsedAnalysis.recommendations;
      if (reco.renforcer_dossier) {
        doc.text(`• Renforcer le dossier : ${reco.renforcer_dossier}`, { align: "justify" });
        doc.moveDown(0.4);
      }
      if (reco.ameliorer_profil) {
        doc.text(`• Améliorer le profil : ${reco.ameliorer_profil}`, { align: "justify" });
        doc.moveDown(0.4);
      }
      if (reco.points_a_valoriser) {
        doc.text(`• Points à valoriser : ${reco.points_a_valoriser}`, { align: "justify" });
        doc.moveDown(0.4);
      }
      if (reco.erreurs_a_eviter) {
        doc.text(`• Erreurs à éviter : ${reco.erreurs_a_eviter}`, { align: "justify" });
      }
      doc.moveDown(1.5);
    }

    // Plan de Dépôt
    if (parsedAnalysis.plan_de_depot && Array.isArray(parsedAnalysis.plan_de_depot) && parsedAnalysis.plan_de_depot.length > 0) {
      doc.fontSize(16).fillColor(GOLD).text("Plan de Dépôt", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(TEXT);
      parsedAnalysis.plan_de_depot.forEach((step, index) => {
        doc.text(`${index + 1}. ${step}`);
      });
      doc.moveDown(1.5);
    }

    // Checklist
    if (parsedAnalysis.checklist && Array.isArray(parsedAnalysis.checklist) && parsedAnalysis.checklist.length > 0) {
      doc.fontSize(16).fillColor(GOLD).text("Checklist Finale", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(TEXT);
      parsedAnalysis.checklist.forEach(item => {
        doc.text(`☐ ${item}`);
      });
    }

    addFooter();

    doc.end();

  } catch (error) {
    console.error("❌ Erreur génération PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erreur lors de la génération du PDF" });
    }
  }
}

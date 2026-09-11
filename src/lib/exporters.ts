import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Campaign, AVCut } from '../db/db';

/**
 * Export the Master 3-Column AV Script as a multi-page PDF document
 */
export function exportScriptToPdf(campaign: Campaign) {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(20);
  doc.text(`Master AV Script: ${campaign.title}`, 14, 20);
  
  if (!campaign.avScript || campaign.avScript.length === 0) {
    doc.text('No script data available.', 14, 40);
    doc.save(`${campaign.title.replace(/\s+/g, '_')}_Script.pdf`);
    return;
  }

  // Draw table headers
  doc.setFontSize(12);
  doc.text('Time', 14, 40);
  doc.text('Visuals / Camera / OST', 60, 40);
  doc.text('VO Script / Phonetics / SFX', 180, 40);
  doc.line(14, 45, 280, 45);

  let yPos = 55;
  campaign.avScript.forEach((cut: AVCut) => {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(10);
    doc.text(`Act ${cut.act} | ${cut.timestampStart} - ${cut.timestampEnd}`, 14, yPos);
    
    // Auto-wrap text
    const visualsLines = doc.splitTextToSize(`${cut.visualDescription}\n[Camera: ${cut.cameraMovement}]`, 110);
    doc.text(visualsLines, 60, yPos);
    
    const audioLines = doc.splitTextToSize(`${cut.audioVoiceover}\n[BGM: ${cut.bgmCue}]`, 100);
    doc.text(audioLines, 180, yPos);

    const maxLines = Math.max(visualsLines.length, audioLines.length);
    yPos += (maxLines * 5) + 10;
  });

  doc.save(`${campaign.title.replace(/\s+/g, '_')}_Script.pdf`);
}

/**
 * Capture a UI component (like the timeline view) into a high-res PNG image
 */
export async function exportTimelineToImage(elementId: string, filename: string) {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  try {
    const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2 });
    saveAs(dataUrl, `${filename}.png`);
  } catch (error) {
    console.error('Failed to export image:', error);
    throw new Error('Image export failed');
  }
}

/**
 * Export project workspace backup as a structured JSON bundle
 */
export function exportProjectData(campaign: Campaign) {
  const jsonStr = JSON.stringify(campaign, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `${campaign.title.replace(/\s+/g, '_')}_Backup.json`);
}

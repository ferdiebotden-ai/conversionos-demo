import { jsPDF } from 'jspdf';

export type PaperSize = 'letter' | 'tabloid';
export type ArchitecturalScale = '1/4"=1\'-0"' | '1/2"=1\'-0"' | '1:50' | '1:100';

export interface TitleBlockData {
  projectName: string;
  address: string;
  designerName: string;
  date: string;
  sheetTitle: string;
  scale: ArchitecturalScale;
  includeScaleBar: boolean;
  includeNorthArrow: boolean;
}

const PAPER_SIZES: Record<PaperSize, { width: number; height: number }> = {
  letter: { width: 279.4, height: 215.9 }, // mm (landscape 11x8.5)
  tabloid: { width: 431.8, height: 279.4 }, // mm (landscape 17x11)
};

const TITLE_BLOCK_HEIGHT = 35; // mm
const MARGIN = 10; // mm

export function generatePDF(
  canvasDataUrl: string,
  paperSize: PaperSize,
  titleBlock: TitleBlockData
): Promise<Blob> {
  return new Promise((resolve) => {
    const paper = PAPER_SIZES[paperSize];
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [paper.width, paper.height],
    });

    const drawAreaWidth = paper.width - MARGIN * 2;
    const drawAreaHeight = paper.height - MARGIN * 2 - TITLE_BLOCK_HEIGHT;

    // Add drawing image (grayscale)
    const img = new Image();
    img.onload = () => {
      // Calculate aspect ratio
      const imgAspect = img.width / img.height;
      const areaAspect = drawAreaWidth / drawAreaHeight;

      let imgW: number, imgH: number;
      if (imgAspect > areaAspect) {
        imgW = drawAreaWidth;
        imgH = drawAreaWidth / imgAspect;
      } else {
        imgH = drawAreaHeight;
        imgW = drawAreaHeight * imgAspect;
      }

      const imgX = MARGIN + (drawAreaWidth - imgW) / 2;
      const imgY = MARGIN + (drawAreaHeight - imgH) / 2;

      // Draw border around drawing area
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(MARGIN, MARGIN, drawAreaWidth, drawAreaHeight);

      // Add the canvas image
      doc.addImage(canvasDataUrl, 'PNG', imgX, imgY, imgW, imgH);

      // Title block
      const tbY = paper.height - MARGIN - TITLE_BLOCK_HEIGHT;
      doc.setLineWidth(0.5);
      doc.rect(MARGIN, tbY, drawAreaWidth, TITLE_BLOCK_HEIGHT);

      // Title block content
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(titleBlock.projectName, MARGIN + 5, tbY + 10);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(titleBlock.address || '', MARGIN + 5, tbY + 16);
      doc.text(`Sheet: ${titleBlock.sheetTitle || 'Floor Plan'}`, MARGIN + 5, tbY + 22);
      doc.text(`Date: ${titleBlock.date}`, MARGIN + 5, tbY + 28);

      // Right side of title block
      const rightX = MARGIN + drawAreaWidth - 80;
      doc.text(`Designer: ${titleBlock.designerName || 'N/A'}`, rightX, tbY + 10);
      doc.text(`Scale: ${titleBlock.scale}`, rightX, tbY + 16);

      // Divider line in title block
      doc.setLineWidth(0.3);
      doc.line(rightX - 5, tbY, rightX - 5, tbY + TITLE_BLOCK_HEIGHT);

      // Scale bar (in PDF, not from canvas)
      if (titleBlock.includeScaleBar) {
        const sbX = rightX;
        const sbY = tbY + 22;
        doc.setFontSize(7);
        doc.text('Scale Bar', sbX, sbY);
        doc.setLineWidth(0.3);
        const barLen = 30; // mm on paper
        doc.line(sbX, sbY + 2, sbX + barLen, sbY + 2);
        doc.line(sbX, sbY + 1, sbX, sbY + 3);
        doc.line(sbX + barLen, sbY + 1, sbX + barLen, sbY + 3);
        doc.line(sbX + barLen / 2, sbY + 1.5, sbX + barLen / 2, sbY + 2.5);
      }

      // North arrow
      if (titleBlock.includeNorthArrow) {
        const naX = MARGIN + drawAreaWidth - 15;
        const naY = MARGIN + 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('N', naX + 3, naY);
        // Arrow
        doc.setLineWidth(0.5);
        doc.line(naX + 4, naY + 2, naX + 4, naY + 12);
        doc.line(naX + 4, naY + 2, naX + 2, naY + 6);
        doc.line(naX + 4, naY + 2, naX + 6, naY + 6);
      }

      resolve(doc.output('blob'));
    };
    img.src = canvasDataUrl;
  });
}

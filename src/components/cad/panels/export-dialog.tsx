'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Download, FileImage, FileText } from 'lucide-react';
import {
  generatePDF,
  type PaperSize,
  type ArchitecturalScale,
} from '../lib/export/pdf-generator';
import { captureCanvas, findCanvasElement, downloadDataUrl, downloadBlob } from '../lib/export/canvas-capture';

interface ExportDialogProps {
  drawingName?: string | undefined;
}

export function ExportDialog({ drawingName = 'Untitled Drawing' }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Print layout settings
  const [paperSize, setPaperSize] = useState<PaperSize>('letter');
  const [scale, setScale] = useState<ArchitecturalScale>('1/4"=1\'-0"');
  const [projectName, setProjectName] = useState(drawingName);
  const [address, setAddress] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [sheetTitle, setSheetTitle] = useState('Floor Plan');
  const [includeScaleBar, setIncludeScaleBar] = useState(true);
  const [includeNorthArrow, setIncludeNorthArrow] = useState(true);

  function getCanvas(): HTMLCanvasElement | null {
    // Find the R3F canvas in the DOM
    const container = document.querySelector('.h-full.w-full canvas') as HTMLCanvasElement | null;
    if (container) return container;
    // Fallback: search broader
    return document.querySelector('canvas[data-engine]') ?? document.querySelector('canvas');
  }

  function sanitize(s: string) {
    return s.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  async function handleExportPNG() {
    const canvas = getCanvas();
    if (!canvas) return;
    const dataUrl = captureCanvas(canvas, 2);
    const date = new Date().toISOString().slice(0, 10);
    downloadDataUrl(dataUrl, `A-P-01_${sanitize(projectName)}_${date}.png`);
  }

  async function handleExportPDF() {
    const canvas = getCanvas();
    if (!canvas) return;
    setGenerating(true);

    try {
      const date = new Date().toISOString().slice(0, 10);
      const dataUrl = captureCanvas(canvas, 2);
      const blob = await generatePDF(dataUrl, paperSize, {
        projectName,
        address,
        designerName,
        date,
        sheetTitle,
        scale,
        includeScaleBar,
        includeNorthArrow,
      });
      downloadBlob(blob, `A-P-01_${sanitize(projectName)}_${sanitize(sheetTitle)}_${date}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Drawing</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="quick" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Export</TabsTrigger>
            <TabsTrigger value="print">Print Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={handleExportPNG}
            >
              <FileImage className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Export as PNG</div>
                <div className="text-xs text-muted-foreground">Screenshot of current view</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={handleExportPDF}
              disabled={generating}
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">{generating ? 'Generating...' : 'Export as PDF'}</div>
                <div className="text-xs text-muted-foreground">Single-page PDF with auto-scale</div>
              </div>
            </Button>
          </TabsContent>

          <TabsContent value="print" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Paper Size</Label>
                <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter (8.5&quot;x11&quot;)</SelectItem>
                    <SelectItem value="tabloid">Tabloid (11&quot;x17&quot;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Scale</Label>
                <Select value={scale} onValueChange={(v) => setScale(v as ArchitecturalScale)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'1/4"=1\'-0"'}>1/4&quot;=1&apos;-0&quot;</SelectItem>
                    <SelectItem value={'1/2"=1\'-0"'}>1/2&quot;=1&apos;-0&quot;</SelectItem>
                    <SelectItem value="1:50">1:50</SelectItem>
                    <SelectItem value="1:100">1:100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Project Name</Label>
              <Input
                className="h-8 text-xs"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input
                className="h-8 text-xs"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Ontario ON"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Designer</Label>
                <Input
                  className="h-8 text-xs"
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sheet Title</Label>
                <Input
                  className="h-8 text-xs"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={includeScaleBar}
                  onChange={(e) => setIncludeScaleBar(e.target.checked)}
                  className="rounded"
                />
                Scale bar
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={includeNorthArrow}
                  onChange={(e) => setIncludeNorthArrow(e.target.checked)}
                  className="rounded"
                />
                North arrow
              </label>
            </div>

            <Button
              className="w-full"
              onClick={handleExportPDF}
              disabled={generating}
            >
              {generating ? 'Generating PDF...' : 'Generate PDF'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

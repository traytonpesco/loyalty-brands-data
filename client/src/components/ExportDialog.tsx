import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';

type ExportFormat = 'csv' | 'excel' | 'json' | 'xml';

interface ExportDialogProps {
  campaignId?: string;
  tenantId?: string;
  type: 'single' | 'multiple' | 'aggregate';
  buttonText?: string;
  className?: string;
}

export default function ExportDialog({ 
  campaignId, 
  tenantId, 
  type,
  buttonText = 'Export Data',
  className = ''
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('token');
      
      let url = '';
      let body: any = { format };
      
      if (type === 'single' && campaignId) {
        url = `/api/exports/campaign/${campaignId}`;
      } else if (type === 'multiple' && tenantId) {
        url = '/api/exports/campaigns';
        body.tenantId = tenantId;
      } else if (type === 'aggregate' && tenantId) {
        url = `/api/exports/aggregate/${tenantId}`;
      } else {
        throw new Error('Invalid export configuration');
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export_${Date.now()}.${format}`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }
      
      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose a format to export your data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('csv')}
                disabled={isExporting}
              >
                CSV
              </Button>
              <Button
                variant={format === 'excel' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('excel')}
                disabled={isExporting}
              >
                Excel
              </Button>
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('json')}
                disabled={isExporting}
              >
                JSON
              </Button>
              <Button
                variant={format === 'xml' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('xml')}
                disabled={isExporting}
              >
                XML
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


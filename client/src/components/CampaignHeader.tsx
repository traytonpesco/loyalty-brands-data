import { formatDate } from '../data/campaigns';
import { exportPageToPDF } from '../utils/pdfExport';

interface CampaignHeaderProps {
  name: string;
  startDate: string;
  endDate: string;
  machineId: string;
}

export default function CampaignHeader({ name, startDate, endDate, machineId }: CampaignHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-asda-darkgreen">{name} Campaign</h1>
        <button 
          onClick={exportPageToPDF} 
          className="no-print px-4 py-2 bg-asda-green text-white rounded-md hover:bg-asda-darkgreen transition-colors"
        >
          Export PDF
        </button>
      </div>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="font-semibold">Period:</span> {formatDate(startDate)} - {formatDate(endDate)}
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <span className="font-semibold">Machine:</span> {machineId}
        </span>
      </div>
    </div>
  );
}


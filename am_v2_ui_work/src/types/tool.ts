export type ToolStatus = 'Available' | 'In Use' | 'Maintenance' | 'Offline';

export type ToolCategory =
  | 'CNC Machining'
  | 'Stamping & Press'
  | 'Molding & Injection'
  | 'Assembly & Torque'
  | 'Metrology & Inspection'
  | 'Welding & Fab';

export type ToolCriticality = 'High' | 'Medium' | 'Standard';

export interface Tool {
  id: string;                    // e.g. "TL-CNC-104"
  name: string;                  // e.g. "5-Axis Solid Carbide End Mill Ø16mm"
  category: ToolCategory;
  status: ToolStatus;
  location: string;              // e.g. "Rack A-04 (Tool Crib)" or "Cell CNC-02"
  assignedTo: string;            // Operator or machine e.g. "CNC-VMC-01 (Op. Alex R.)" or "Unassigned"
  lastUpdated: string;           // ISO timestamp
  cyclesCurrent: number;         // e.g. 4200
  cyclesMax: number;             // e.g. 5000
  wearPercent: number;           // 0-100%
  serialNumber: string;          // e.g. "SN-882410-X"
  manufacturer: string;          // e.g. "Sandvik Coromant", "Kennametal", "Mitutoyo"
  criticality: ToolCriticality;
  lastMaintenanceDate: string;   // YYYY-MM-DD
  nextMaintenanceDue: string;    // YYYY-MM-DD
  notes: string;
}

export interface StatusLogEntry {
  id: string;
  toolId: string;
  toolName: string;
  previousStatus: ToolStatus;
  newStatus: ToolStatus;
  timestamp: string;
  updatedBy: string;
  reason: string;
  assignedTarget?: string;
  location?: string;
}

export interface StatusUpdatePayload {
  newStatus: ToolStatus;
  operatorName?: string;
  location?: string;
  assignedTo?: string;
  reason?: string;
  maintenanceType?: string;
  estimatedReturnTime?: string;
  cycleIncrement?: number;
}

import { Tool, StatusLogEntry, StatusUpdatePayload, ToolStatus } from '../types/tool';
import { INITIAL_TOOLS, INITIAL_LOGS } from '../data/initialTools';

const STORAGE_TOOLS_KEY = 'tooltrack_inventory_v2';
const STORAGE_LOGS_KEY = 'tooltrack_logs_v2';
const STORAGE_SIM_KEY = 'tooltrack_sim_active';

export class ToolService {
  static getTools(): Tool[] {
    try {
      const data = localStorage.getItem(STORAGE_TOOLS_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(INITIAL_TOOLS));
        return INITIAL_TOOLS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TOOLS;
    }
  }

  static saveTools(tools: Tool[]): void {
    try {
      localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(tools));
    } catch (e) {
      console.error('Failed to save tools:', e);
    }
  }

  static getLogs(): StatusLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_LOGS_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(INITIAL_LOGS));
        return INITIAL_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_LOGS;
    }
  }

  static saveLogs(logs: StatusLogEntry[]): void {
    try {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs:', e);
    }
  }

  static isSimulationEnabled(): boolean {
    return localStorage.getItem(STORAGE_SIM_KEY) === 'true';
  }

  static setSimulationEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_SIM_KEY, String(enabled));
  }

  static updateToolStatus(
    toolId: string,
    payload: StatusUpdatePayload,
    updatedBy: string = 'Shopfloor Operator'
  ): { updatedTool: Tool; log: StatusLogEntry } {
    const tools = this.getTools();
    const index = tools.findIndex((t) => t.id === toolId);
    if (index === -1) {
      throw new Error(`Tool with ID ${toolId} not found`);
    }

    const currentTool = tools[index];
    const prevStatus = currentTool.status;
    const now = new Date().toISOString();

    // Determine new location and assignedTo based on status semantics
    let newLocation = payload.location || currentTool.location;
    let newAssignedTo = payload.assignedTo || currentTool.assignedTo;

    if (payload.newStatus === 'Available') {
      newAssignedTo = 'Unassigned';
      if (!payload.location) {
        newLocation = currentTool.location.includes('Crib')
          ? currentTool.location
          : 'Tool Crib A · Main Storage';
      }
    } else if (payload.newStatus === 'Maintenance') {
      if (!payload.location) {
        newLocation = 'Maintenance & Tool Room Bay 1';
      }
      if (!payload.assignedTo) {
        newAssignedTo = 'Assigned to Toolmaker on duty';
      }
    } else if (payload.newStatus === 'Offline') {
      if (!payload.location) {
        newLocation = 'Quarantine & Inspection Area';
      }
    }

    const newCycles = currentTool.cyclesCurrent + (payload.cycleIncrement || 0);
    const newWear = Math.min(100, Math.round((newCycles / currentTool.cyclesMax) * 100));

    const updatedTool: Tool = {
      ...currentTool,
      status: payload.newStatus,
      location: newLocation,
      assignedTo: newAssignedTo,
      lastUpdated: now,
      cyclesCurrent: newCycles,
      wearPercent: newWear,
      notes: payload.reason ? `${payload.reason} (${new Date().toLocaleDateString()})` : currentTool.notes,
    };

    tools[index] = updatedTool;
    this.saveTools(tools);

    // Create log entry
    const log: StatusLogEntry = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      toolId: updatedTool.id,
      toolName: updatedTool.name,
      previousStatus: prevStatus,
      newStatus: payload.newStatus,
      timestamp: now,
      updatedBy: payload.operatorName || updatedBy,
      reason: payload.reason || `Status updated from ${prevStatus} to ${payload.newStatus}`,
      assignedTarget: newAssignedTo,
      location: newLocation,
    };

    const logs = this.getLogs();
    this.saveLogs([log, ...logs].slice(0, 50)); // keep last 50 entries

    return { updatedTool, log };
  }

  static batchUpdateStatus(
    toolIds: string[],
    newStatus: ToolStatus,
    reason: string,
    updatedBy: string = 'Supervisor'
  ): { updatedCount: number } {
    let count = 0;
    toolIds.forEach((id) => {
      try {
        this.updateToolStatus(id, { newStatus, reason }, updatedBy);
        count++;
      } catch (e) {
        console.warn(`Failed to update ${id}:`, e);
      }
    });
    return { updatedCount: count };
  }

  static addTool(tool: Omit<Tool, 'lastUpdated'>): Tool {
    const tools = this.getTools();
    if (tools.some((t) => t.id.toLowerCase() === tool.id.toLowerCase())) {
      throw new Error(`Tool ID "${tool.id}" already exists.`);
    }

    const newTool: Tool = {
      ...tool,
      lastUpdated: new Date().toISOString(),
    };

    this.saveTools([newTool, ...tools]);

    // Create initial creation log
    const log: StatusLogEntry = {
      id: `LOG-NEW-${Date.now().toString(36).toUpperCase()}`,
      toolId: newTool.id,
      toolName: newTool.name,
      previousStatus: 'Offline',
      newStatus: newTool.status,
      timestamp: newTool.lastUpdated,
      updatedBy: 'System Admin',
      reason: 'New tool asset registered into inventory system.',
      assignedTarget: newTool.assignedTo,
      location: newTool.location,
    };
    const logs = this.getLogs();
    this.saveLogs([log, ...logs]);

    return newTool;
  }

  static deleteTool(toolId: string): void {
    const tools = this.getTools();
    const filtered = tools.filter((t) => t.id !== toolId);
    this.saveTools(filtered);
  }

  static simulateRandomActivity(): { tool: Tool; log: StatusLogEntry } | null {
    const tools = this.getTools();
    if (tools.length === 0) return null;

    // Pick a random tool
    const randomIndex = Math.floor(Math.random() * tools.length);
    const tool = tools[randomIndex];

    // Status transition cycle simulation:
    // Available -> In Use
    // In Use -> Available (job finished) OR In Use -> Maintenance (high wear)
    // Maintenance -> Available (serviced)
    // Offline -> Available (repaired) OR Maintenance
    let nextStatus: ToolStatus;
    let reason = '';
    let assigned = tool.assignedTo;
    let location = tool.location;
    let cycleInc = 0;

    if (tool.status === 'Available') {
      nextStatus = 'In Use';
      const machines = ['CNC Milling 5-Axis #01', 'Stamping Press 250T', 'Molding Cell #03', 'Assembly Bench 2'];
      const opNames = ['Marcus V.', 'Sarah J.', 'Tomasz B.', 'Alex R.'];
      const chosenMachine = machines[Math.floor(Math.random() * machines.length)];
      const chosenOp = opNames[Math.floor(Math.random() * opNames.length)];
      assigned = `${chosenMachine} (Op. ${chosenOp})`;
      location = 'Production Floor Active Bay';
      reason = `Checked out for production order work package #${Math.floor(1000 + Math.random() * 9000)}.`;
      cycleInc = Math.floor(50 + Math.random() * 150);
    } else if (tool.status === 'In Use') {
      if (tool.wearPercent >= 85 || Math.random() < 0.25) {
        nextStatus = 'Maintenance';
        assigned = 'Toolmaker Hendra K.';
        location = 'Tool Maintenance Bay 2';
        reason = `Cycle threshold reached (${tool.cyclesCurrent} cycles). Dispatched for scheduled inspection & regrind.`;
      } else {
        nextStatus = 'Available';
        assigned = 'Unassigned';
        location = 'Tool Crib Rack 02-B';
        reason = 'Production batch completed. Tool cleaned, inspected, and returned to storage rack.';
        cycleInc = Math.floor(100 + Math.random() * 200);
      }
    } else if (tool.status === 'Maintenance') {
      nextStatus = 'Available';
      assigned = 'Unassigned';
      location = 'Tool Crib Storage A';
      reason = 'Preventive maintenance, regrinding, and optical calibration completed successfully.';
    } else {
      // Offline
      nextStatus = 'Maintenance';
      assigned = 'Senior Maintenance Specialist';
      location = 'Diagnostics & Repair Bench';
      reason = 'Spare parts arrived. Dispatched for repair and overhaul.';
    }

    const result = this.updateToolStatus(
      tool.id,
      {
        newStatus: nextStatus,
        assignedTo: assigned,
        location,
        reason,
        cycleIncrement: cycleInc,
        operatorName: 'Automated Telemetry / Shopfloor Sensor',
      },
      'IoT Sensor'
    );

    return { tool: result.updatedTool, log: result.log };
  }

  static resetToDefaults(): void {
    localStorage.removeItem(STORAGE_TOOLS_KEY);
    localStorage.removeItem(STORAGE_LOGS_KEY);
  }
}

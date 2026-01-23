import { api } from '@/services/api/axios';

interface SimulationPayload {
  code: string;
}

interface SimulationResult {
  steps: any[]; // TODO: Define specific types
  source_lines: string[];
}

export async function executeJsCode(payload: SimulationPayload): Promise<SimulationResult> {
  const response = await api.post<SimulationResult>('/simulators/javascript/execute', payload);
  return response.data;
}

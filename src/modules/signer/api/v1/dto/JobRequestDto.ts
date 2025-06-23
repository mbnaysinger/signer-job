export interface JobExecuteRequestDto {
  // Pode ser expandido no futuro para aceitar parâmetros específicos
}

export interface JobStatusResponseDto {
  active: boolean;
  lastExecution: string;
  intervalMinutes: number;
}

export interface JobExecuteResponseDto {
  success: boolean;
  message: string;
  timestamp: string;
} 
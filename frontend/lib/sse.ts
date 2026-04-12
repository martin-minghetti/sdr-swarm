export interface SSEEvent {
  event: string;
  data: {
    step?: string;
    error?: string;
    research_id?: string;
    [key: string]: unknown;
  };
}

export type SSEHandler = {
  onStepStart?: (step: string) => void;
  onStepProgress?: (step: string, data: Record<string, unknown>) => void;
  onStepComplete?: (step: string) => void;
  onStepError?: (step: string, error: string) => void;
  onResearchComplete?: (researchId: string) => void;
  onError?: (error: Event) => void;
};

export function subscribeToStream(url: string, handlers: SSEHandler): () => void {
  const es = new EventSource(url);

  es.addEventListener("step_start", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    handlers.onStepStart?.(data.step);
  });

  es.addEventListener("step_progress", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    handlers.onStepProgress?.(data.step, data);
  });

  es.addEventListener("step_complete", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    handlers.onStepComplete?.(data.step);
  });

  es.addEventListener("step_error", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    handlers.onStepError?.(data.step, data.error ?? "Unknown error");
  });

  es.addEventListener("research_complete", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    handlers.onResearchComplete?.(data.research_id);
    es.close();
  });

  es.onerror = (e) => {
    handlers.onError?.(e);
    es.close();
  };

  return () => es.close();
}

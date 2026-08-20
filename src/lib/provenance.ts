export type ProvenanceStep =
  | "USER_DECLARED"
  | "OBSERVED"
  | "RESEARCHED"
  | "INFERRED"
  | "SELECTED"
  | "VERIFIED";

export const REQUIRED_CHAIN: ProvenanceStep[] = [
  "USER_DECLARED",
  "OBSERVED",
  "RESEARCHED",
  "INFERRED",
  "SELECTED",
  "VERIFIED"
];

export interface ProvenanceRecord {
  step: ProvenanceStep;
  timestamp: string;
  evidence: string[];
  model?: string;
  payload?: unknown;
}

export class ProvenanceLog {
  private records: ProvenanceRecord[] = [];

  add(step: ProvenanceStep, evidence: string[] = [], model?: string, payload?: unknown) {
    this.records.push({
      step,
      timestamp: new Date().toISOString(),
      evidence,
      model,
      payload
    });
  }

  getAll(): ProvenanceRecord[] {
    return [...this.records];
  }

  /** Returns true only if every required step exists and is in correct order */
  verify(): { ok: boolean; missing: ProvenanceStep[]; outOfOrder: boolean } {
    const present = this.records.map(r => r.step);
    const missing = REQUIRED_CHAIN.filter(s => !present.includes(s));

    let outOfOrder = false;
    let lastIndex = -1;
    for (const step of present) {
      const idx = REQUIRED_CHAIN.indexOf(step);
      if (idx < lastIndex) {
        outOfOrder = true;
        break;
      }
      lastIndex = idx;
    }

    return {
      ok: missing.length === 0 && !outOfOrder,
      missing,
      outOfOrder
    };
  }

  toYAML(): string {
    const lines = ["provenance:", "  chain:"];
    for (const r of this.records) {
      lines.push(`    - step: ${r.step}`);
      lines.push(`      timestamp: ${r.timestamp}`);
      if (r.model) lines.push(`      model: ${r.model}`);
      if (r.evidence.length) {
        lines.push(`      evidence:`);
        r.evidence.forEach(e => lines.push(`        - ${JSON.stringify(e)}`));
      }
    }
    return lines.join("\n");
  }
}

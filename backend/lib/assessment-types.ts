import type { AnswerStatus } from "./options";

export type EvidenceItem = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type QuestionRow = {
  ref: string;
  categoryCode: string;
  categoryName: string;
  question: string;
  status: AnswerStatus | null;
  notes: string;
  remarks: string;
  actionPlan: string;
  guidance: string;
  bestPractices: string;
  evidence: EvidenceItem[];
};

export type QuestionDetailTab = "reporting" | "guidance" | "remarks" | "action-plan" | "best-practices";

export type LibraryItem = EvidenceItem & {
  ref: string;
  section: string;
  categoryName: string;
  question: string;
};

export type FilterId = "all" | "unanswered" | "YES" | "NO" | "NA" | "missing";

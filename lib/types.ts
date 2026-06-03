export interface Question {
  id: number;
  /** The question text shown to the candidate. */
  text: string;
  /** Answer options for MCQ. Empty for open-ended questions. */
  options: string[];
  /** Exact text of the correct option — compared against selected string for grading. Empty for open-ended. */
  correctAnswer: string;
  /** Points awarded for a correct answer. */
  marks: number;
  /** "open" = free-text answer; omit or "mcq" = multiple choice (default). */
  type?: "mcq" | "open";
}

export interface ExamConfig {
  /** URL slug — also used as the unique exam identifier. */
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  /** Total exam duration in seconds. */
  durationSeconds: number;
  questions: Question[];
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  examSlug: string;
}

export interface ExamResult {
  user: UserData;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  /** Selected option text keyed by question index. */
  answers: Record<number, string | null>;
  timeTaken: number;
  submittedAt: string;
}

export type QuestionStatus = "unanswered" | "answered" | "marked";

export interface Question {
  id: number;
  /** The question text shown to the candidate. */
  text: string;
  /** Four answer options. These are shuffled at runtime; grading uses `correctAnswer`. */
  options: string[];
  /** Exact text of the correct option — compared against selected string for grading. */
  correctAnswer: string;
  /** Points awarded for a correct answer. */
  marks: number;
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

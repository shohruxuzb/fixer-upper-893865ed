export interface IELTSQuestion {
  part: 1 | 2 | 3;
  question: string;
  followUp?: string[];
}

export const part1Questions: IELTSQuestion[] = [];
export const part2Questions: IELTSQuestion[] = [];
export const part3Questions: IELTSQuestion[] = [];

export function getRandomQuestion(part: 1 | 2 | 3): IELTSQuestion {
  return { part, question: "Loading..." };
}

export function getRandomQuestions(part: 1 | 2 | 3, count: number): IELTSQuestion[] {
  return Array(count).fill({ part, question: "Loading..." });
}

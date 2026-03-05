export interface IELTSQuestion {
  part: 1 | 2 | 3;
  question: string;
  followUp?: string[];
}

export const part1Questions: IELTSQuestion[] = [
  { part: 1, question: "Where do you live?", followUp: ["Do you like living there?", "What do you like most about your hometown?"] },
  { part: 1, question: "Do you work or study?", followUp: ["What do you enjoy about your work/studies?"] },
  { part: 1, question: "What do you do in your free time?", followUp: ["Have your hobbies changed since you were a child?"] },
  { part: 1, question: "Do you like reading books?", followUp: ["What kind of books do you prefer?"] },
  { part: 1, question: "How often do you use the internet?", followUp: ["What do you mostly use it for?"] },
  { part: 1, question: "Do you like cooking?", followUp: ["What is your favourite dish to cook?"] },
  { part: 1, question: "What kind of music do you enjoy?", followUp: ["Do you play any musical instruments?"] },
  { part: 1, question: "Do you prefer morning or evening?", followUp: ["What do you usually do in the morning?"] },
];

export const part2Questions: IELTSQuestion[] = [
  { part: 2, question: "Describe a place you have visited that you found very beautiful. You should say: where it was, when you went there, what you did there, and explain why you found it beautiful." },
  { part: 2, question: "Describe a person who has influenced you. You should say: who this person is, how you know them, what they have done, and explain how they influenced you." },
  { part: 2, question: "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would benefit you." },
  { part: 2, question: "Describe an important event in your life. You should say: what happened, when it happened, who was involved, and explain why it was important to you." },
];

export const part3Questions: IELTSQuestion[] = [
  { part: 3, question: "How has technology changed the way people communicate?", followUp: ["Do you think face-to-face communication will become less common?"] },
  { part: 3, question: "What are the advantages and disadvantages of living in a big city?", followUp: ["Do you think more people will move to cities in the future?"] },
  { part: 3, question: "How important is it for people to learn about other cultures?", followUp: ["What is the best way to learn about a different culture?"] },
  { part: 3, question: "Why do some people prefer to work from home?", followUp: ["What challenges does remote work present?"] },
];

export function getRandomQuestion(part: 1 | 2 | 3): IELTSQuestion {
  const pool = part === 1 ? part1Questions : part === 2 ? part2Questions : part3Questions;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get N unique random questions for a given part */
export function getRandomQuestions(part: 1 | 2 | 3, count: number): IELTSQuestion[] {
  const pool = part === 1 ? part1Questions : part === 2 ? part2Questions : part3Questions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

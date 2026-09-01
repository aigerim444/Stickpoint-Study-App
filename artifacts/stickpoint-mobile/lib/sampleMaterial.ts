import { Card } from './content';

/**
 * A bundled "easy chemistry" sample so a brand-new student can run through
 * every study method before pasting their own notes (tester feedback: give
 * an example run-through). Ships with pre-made cards, so the sample works
 * even before/without the AI connection.
 */

export const SAMPLE_TOPIC = 'Atoms and the Periodic Table';

export const SAMPLE_MATERIAL = `Atoms are the basic building blocks of all matter. Every atom has a nucleus made of protons and neutrons, with electrons orbiting around it.
Protons have a positive charge, electrons have a negative charge, and neutrons have no charge.
The atomic number of an element is the number of protons in its nucleus. It defines which element an atom is.
The periodic table arranges all known elements in order of increasing atomic number.
Rows in the periodic table are called periods, and columns are called groups. Elements in the same group have similar chemical properties.
Elements in group 1 are called alkali metals. They are very reactive and react strongly with water.
Elements in group 18 are called noble gases. They are very unreactive because their outer electron shells are full.
An element is a pure substance made of only one type of atom, like oxygen or gold.
A compound is a substance made of two or more different elements chemically bonded together, like water (H2O) or carbon dioxide (CO2).
A mixture contains two or more substances that are not chemically bonded and can be separated physically, like salt water or air.`;

export const SAMPLE_CARDS: Card[] = [
  { question: 'What are atoms?', answer: 'The basic building blocks of all matter.', methodTag: 'active_recall' },
  { question: 'What three particles make up an atom?', answer: 'Protons and neutrons in the nucleus, with electrons orbiting around it.', methodTag: 'active_recall' },
  { question: 'What charge does a proton have?', answer: 'A positive charge.', methodTag: 'active_recall' },
  { question: 'What charge does an electron have?', answer: 'A negative charge.', methodTag: 'active_recall' },
  { question: 'What is the atomic number of an element?', answer: 'The number of protons in its nucleus — it defines which element an atom is.', methodTag: 'practice_testing' },
  { question: 'How is the periodic table arranged?', answer: 'All known elements in order of increasing atomic number.', methodTag: 'active_recall' },
  { question: 'What are rows and columns of the periodic table called?', answer: 'Rows are periods; columns are groups. Same-group elements have similar chemical properties.', methodTag: 'self_explanation' },
  { question: 'What are alkali metals?', answer: 'Group 1 elements — very reactive, and they react strongly with water.', methodTag: 'elaborative_interrogation' },
  { question: 'Why are noble gases unreactive?', answer: 'Their outer electron shells are full, so they are very stable (group 18).', methodTag: 'elaborative_interrogation' },
  { question: 'What is the difference between an element, a compound, and a mixture?', answer: 'An element is one type of atom; a compound is two or more elements chemically bonded; a mixture is substances not chemically bonded that can be separated physically.', methodTag: 'feynman' },
];

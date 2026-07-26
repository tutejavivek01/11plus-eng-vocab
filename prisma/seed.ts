import { config } from "dotenv";
import { PrismaClient, Difficulty } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SeedWord = {
  word: string;
  definition: string;
  topic: string;
  difficulty: Difficulty;
  synonym?: string;
  antonym?: string;
};

const synonyms: SeedWord[] = [
  { word: "happy", definition: "feeling or showing pleasure", topic: "synonyms", difficulty: "EASY", synonym: "joyful" },
  { word: "big", definition: "of considerable size", topic: "synonyms", difficulty: "EASY", synonym: "large" },
  { word: "fast", definition: "moving quickly", topic: "synonyms", difficulty: "EASY", synonym: "quick" },
  { word: "smart", definition: "having quick intelligence", topic: "synonyms", difficulty: "EASY", synonym: "clever" },
  { word: "brave", definition: "ready to face danger", topic: "synonyms", difficulty: "EASY", synonym: "courageous" },
  { word: "quiet", definition: "making little noise", topic: "synonyms", difficulty: "EASY", synonym: "silent" },
  { word: "angry", definition: "feeling strong displeasure", topic: "synonyms", difficulty: "MEDIUM", synonym: "furious" },
  { word: "tired", definition: "in need of rest", topic: "synonyms", difficulty: "MEDIUM", synonym: "exhausted" },
  { word: "begin", definition: "to start doing something", topic: "synonyms", difficulty: "MEDIUM", synonym: "commence" },
  { word: "hide", definition: "to put out of sight", topic: "synonyms", difficulty: "MEDIUM", synonym: "conceal" },
  { word: "ancient", definition: "very old, from long ago", topic: "synonyms", difficulty: "MEDIUM", synonym: "archaic" },
  { word: "generous", definition: "willing to give freely", topic: "synonyms", difficulty: "MEDIUM", synonym: "charitable" },
  { word: "obstinate", definition: "stubbornly refusing to change", topic: "synonyms", difficulty: "HARD", synonym: "stubborn" },
  { word: "meticulous", definition: "showing great attention to detail", topic: "synonyms", difficulty: "HARD", synonym: "fastidious" },
  { word: "ephemeral", definition: "lasting for a very short time", topic: "synonyms", difficulty: "HARD", synonym: "fleeting" },
  { word: "candid", definition: "truthful and straightforward", topic: "synonyms", difficulty: "HARD", synonym: "frank" },
  { word: "benevolent", definition: "kind and well meaning", topic: "synonyms", difficulty: "HARD", synonym: "kindly" },
  { word: "eloquent", definition: "fluent and persuasive in speech", topic: "synonyms", difficulty: "HARD", synonym: "articulate" },
  { word: "small", definition: "of limited size", topic: "synonyms", difficulty: "EASY", synonym: "little" },
  { word: "cold", definition: "having a low temperature", topic: "synonyms", difficulty: "EASY", synonym: "chilly" },
  { word: "funny", definition: "causing laughter or amusement", topic: "synonyms", difficulty: "EASY", synonym: "amusing" },
  { word: "difficult", definition: "needing much effort to do", topic: "synonyms", difficulty: "MEDIUM", synonym: "challenging" },
  { word: "sad", definition: "feeling or showing sorrow", topic: "synonyms", difficulty: "EASY", synonym: "unhappy" },
  { word: "strange", definition: "unusual or unexpected", topic: "synonyms", difficulty: "MEDIUM", synonym: "odd" },
  { word: "wealthy", definition: "having a great deal of money", topic: "synonyms", difficulty: "MEDIUM", synonym: "rich" },
  { word: "gigantic", definition: "extremely large in size", topic: "synonyms", difficulty: "MEDIUM", synonym: "enormous" },
  { word: "reluctant", definition: "unwilling and hesitant", topic: "synonyms", difficulty: "HARD", synonym: "unwilling" },
  { word: "tenacious", definition: "holding firmly to a course of action", topic: "synonyms", difficulty: "HARD", synonym: "persistent" },
  { word: "scrutinize", definition: "to examine closely and carefully", topic: "synonyms", difficulty: "HARD", synonym: "inspect" },
];

const antonyms: SeedWord[] = [
  { word: "hot", definition: "having a high temperature", topic: "antonyms", difficulty: "EASY", antonym: "cold" },
  { word: "up", definition: "toward a higher position", topic: "antonyms", difficulty: "EASY", antonym: "down" },
  { word: "full", definition: "holding as much as possible", topic: "antonyms", difficulty: "EASY", antonym: "empty" },
  { word: "light", definition: "not heavy", topic: "antonyms", difficulty: "EASY", antonym: "heavy" },
  { word: "wide", definition: "having a large distance side to side", topic: "antonyms", difficulty: "EASY", antonym: "narrow" },
  { word: "early", definition: "occurring before the expected time", topic: "antonyms", difficulty: "EASY", antonym: "late" },
  { word: "polite", definition: "having good manners", topic: "antonyms", difficulty: "MEDIUM", antonym: "rude" },
  { word: "genuine", definition: "truly what it is said to be", topic: "antonyms", difficulty: "MEDIUM", antonym: "fake" },
  { word: "abundant", definition: "existing in large quantities", topic: "antonyms", difficulty: "MEDIUM", antonym: "scarce" },
  { word: "permanent", definition: "lasting forever or a very long time", topic: "antonyms", difficulty: "MEDIUM", antonym: "temporary" },
  { word: "cautious", definition: "careful to avoid danger", topic: "antonyms", difficulty: "MEDIUM", antonym: "reckless" },
  { word: "humble", definition: "having a modest view of one's importance", topic: "antonyms", difficulty: "MEDIUM", antonym: "arrogant" },
  { word: "frugal", definition: "sparing or economical with money", topic: "antonyms", difficulty: "HARD", antonym: "extravagant" },
  { word: "lucid", definition: "expressed clearly, easy to understand", topic: "antonyms", difficulty: "HARD", antonym: "confusing" },
  { word: "meticulous", definition: "very careful and precise", topic: "antonyms", difficulty: "HARD", antonym: "careless" },
  { word: "benevolent", definition: "well meaning and kindly", topic: "antonyms", difficulty: "HARD", antonym: "malicious" },
  { word: "candid", definition: "open and honest", topic: "antonyms", difficulty: "HARD", antonym: "deceptive" },
  { word: "resilient", definition: "able to recover quickly from difficulty", topic: "antonyms", difficulty: "HARD", antonym: "fragile" },
  { word: "strong", definition: "having great physical power", topic: "antonyms", difficulty: "EASY", antonym: "weak" },
  { word: "clean", definition: "free from dirt or marks", topic: "antonyms", difficulty: "EASY", antonym: "dirty" },
  { word: "open", definition: "not closed or blocked", topic: "antonyms", difficulty: "EASY", antonym: "shut" },
  { word: "loud", definition: "producing a lot of noise", topic: "antonyms", difficulty: "MEDIUM", antonym: "quiet" },
  { word: "simple", definition: "easily understood or done", topic: "antonyms", difficulty: "EASY", antonym: "complicated" },
  { word: "victory", definition: "an act of winning a struggle", topic: "antonyms", difficulty: "MEDIUM", antonym: "defeat" },
  { word: "expand", definition: "to become or make larger", topic: "antonyms", difficulty: "MEDIUM", antonym: "contract" },
  { word: "optimistic", definition: "hopeful about the future", topic: "antonyms", difficulty: "MEDIUM", antonym: "pessimistic" },
  { word: "voluntary", definition: "done of one's own free will", topic: "antonyms", difficulty: "HARD", antonym: "compulsory" },
  { word: "transparent", definition: "easy to see through or understand", topic: "antonyms", difficulty: "HARD", antonym: "opaque" },
  { word: "diligent", definition: "showing care and effort in work", topic: "antonyms", difficulty: "HARD", antonym: "lazy" },
];

const spellings: SeedWord[] = [
  { word: "because", definition: "for the reason that", topic: "spellings", difficulty: "EASY" },
  { word: "friend", definition: "a person you like and trust", topic: "spellings", difficulty: "EASY" },
  { word: "believe", definition: "to accept as true", topic: "spellings", difficulty: "EASY" },
  { word: "beautiful", definition: "pleasing to look at", topic: "spellings", difficulty: "EASY" },
  { word: "different", definition: "not the same as another", topic: "spellings", difficulty: "EASY" },
  { word: "necessary", definition: "needing to be done or present", topic: "spellings", difficulty: "MEDIUM" },
  { word: "separate", definition: "forming a distinct unit; apart", topic: "spellings", difficulty: "MEDIUM" },
  { word: "definitely", definition: "without doubt; certainly", topic: "spellings", difficulty: "MEDIUM" },
  { word: "embarrass", definition: "to cause someone to feel awkward", topic: "spellings", difficulty: "MEDIUM" },
  { word: "occurrence", definition: "an incident or event", topic: "spellings", difficulty: "MEDIUM" },
  { word: "government", definition: "the group governing a state", topic: "spellings", difficulty: "MEDIUM" },
  { word: "conscience", definition: "an inner sense of right and wrong", topic: "spellings", difficulty: "HARD" },
  { word: "questionnaire", definition: "a set of printed questions", topic: "spellings", difficulty: "HARD" },
  { word: "unnecessarily", definition: "in a way that is not needed", topic: "spellings", difficulty: "HARD" },
  { word: "accommodate", definition: "to provide lodging or space for", topic: "spellings", difficulty: "HARD" },
  { word: "rhythm", definition: "a strong, regular repeated pattern", topic: "spellings", difficulty: "HARD" },
  { word: "bureaucracy", definition: "a system of government by officials", topic: "spellings", difficulty: "HARD" },
  { word: "receive", definition: "to be given or presented with something", topic: "spellings", difficulty: "EASY" },
  { word: "always", definition: "at all times; on every occasion", topic: "spellings", difficulty: "EASY" },
  { word: "people", definition: "human beings in general", topic: "spellings", difficulty: "EASY" },
  { word: "surprise", definition: "an unexpected event or feeling", topic: "spellings", difficulty: "EASY" },
  { word: "immediately", definition: "at once; without delay", topic: "spellings", difficulty: "MEDIUM" },
  { word: "disappear", definition: "to cease to be visible", topic: "spellings", difficulty: "MEDIUM" },
  { word: "knowledge", definition: "facts, information, and skills acquired", topic: "spellings", difficulty: "MEDIUM" },
  { word: "privilege", definition: "a special right or advantage", topic: "spellings", difficulty: "HARD" },
  { word: "maintenance", definition: "the process of keeping something in good condition", topic: "spellings", difficulty: "HARD" },
  { word: "miscellaneous", definition: "made up of various types", topic: "spellings", difficulty: "HARD" },
];

const generalVocabulary: SeedWord[] = [
  { word: "orchard", definition: "a piece of land planted with fruit trees", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "harbor", definition: "a place on the coast where ships shelter", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "glacier", definition: "a slow-moving mass of ice", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "canyon", definition: "a deep gorge between cliffs", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "expedition", definition: "a journey for a particular purpose", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "hypothesis", definition: "a proposed explanation for something", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "migration", definition: "movement of people or animals to a new area", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "monument", definition: "a structure built to remember a person or event", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "vessel", definition: "a ship or large boat", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "prosperity", definition: "the state of being successful or thriving", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "phenomenon", definition: "a fact or situation observed to exist", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "controversy", definition: "prolonged public disagreement or debate", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "infrastructure", definition: "the basic physical systems of a place", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "legislation", definition: "laws considered collectively", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "diplomacy", definition: "the management of relations between nations", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "sanctuary", definition: "a place of refuge or safety", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "meadow", definition: "a field of grass and wildflowers", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "voyage", definition: "a long journey by sea or in space", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "cavern", definition: "a large cave", topic: "general-vocabulary", difficulty: "EASY" },
  { word: "settlement", definition: "a place where people establish a community", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "artifact", definition: "an object made by a human, of historical interest", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "reservoir", definition: "a large natural or artificial lake for water storage", topic: "general-vocabulary", difficulty: "MEDIUM" },
  { word: "unanimous", definition: "fully in agreement", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "meticulousness", definition: "the quality of showing great care over details", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "renaissance", definition: "a revival of activity or interest in something", topic: "general-vocabulary", difficulty: "HARD" },
  { word: "jurisdiction", definition: "the official power to make legal decisions", topic: "general-vocabulary", difficulty: "HARD" },
];

const WORDS: SeedWord[] = [...synonyms, ...antonyms, ...spellings, ...generalVocabulary];

async function main() {
  for (const w of WORDS) {
    await prisma.word.upsert({
      where: { word_topic: { word: w.word, topic: w.topic } },
      update: {
        definition: w.definition,
        difficulty: w.difficulty,
        synonym: w.synonym,
        antonym: w.antonym,
      },
      create: w,
    });
  }
  console.log(`Seeded/updated ${WORDS.length} words.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

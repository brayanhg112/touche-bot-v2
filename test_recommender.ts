import { recommend } from './app/lib/recommender';
import { BotAnswers } from './app/lib/types';

const input: BotAnswers = {
  name: "Prueba",
  gender: "M",
  occasion: "noche",
  projection: "",
  feel: ["dulce"],
  avoid: ["Oud"]
};

const res = recommend(input);
console.log("Recomendaciones:");
res.forEach((r, i) => {
  console.log(`${i + 1}. ${r.perfume.name} (${r.perfume.brand}) - Score: ${r.score}`);
});

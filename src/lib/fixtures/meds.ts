/**
 * SAMPLE EDUCATION CONTENT — placeholder for the care team to review
 * (medication_content in Section 3.2). Hand-written, never AI-generated at
 * runtime. It explains why a medicine matters; it never gives advice about
 * doses, timing, food, or missed doses. Those questions go to the care team.
 */

export type MedIcon = "shield" | "heart" | "check" | "clock" | "bolt" | "flame";

export type MedContent = {
  nick: string;
  hook: string;
  journey: { icon: MedIcon; title: string; text: string }[];
  facts: [string, string][];
};

export type SampleMed = {
  slug: string;
  name: string;
  form: "capsule" | "tablet";
  color: string;
  content: Record<"en" | "es", MedContent>;
};

export const sampleMeds: SampleMed[] = [
  {
    slug: "tacrolimus",
    name: "Tacrolimus",
    form: "capsule",
    color: "#2f8f55",
    content: {
      en: {
        nick: "The Peacekeeper",
        hook: "Keeps your body from fighting your new kidney.",
        journey: [
          { icon: "shield", title: "Meet your bodyguard", text: "Your immune system fights anything it doesn't know. That's its job." },
          { icon: "heart", title: "It doesn't know your kidney yet", text: "Your kidney is new, so your bodyguard sees it as a stranger." },
          { icon: "check", title: "Tacrolimus keeps the peace", text: "It tells your bodyguard the kidney is on your team, so it stands down." },
          { icon: "clock", title: "Steady every day", text: "Your care team picked your med times to keep the peace day and night." },
        ],
        facts: [
          ["Why the same times every day?", "Steady levels mean steady protection for your kidney."],
          ["Why the blood tests?", "Your clinic checks the level to keep it in the right range for you."],
          ["Have a question about your meds?", "Ask your care team. Relay never makes changes to your meds."],
        ],
      },
      es: {
        nick: "El Pacificador",
        hook: "Evita que tu cuerpo pelee con tu riñón nuevo.",
        journey: [
          { icon: "shield", title: "Conoce a tu guardaespaldas", text: "Tu sistema inmune pelea con todo lo que no conoce. Ese es su trabajo." },
          { icon: "heart", title: "Todavía no conoce tu riñón", text: "Tu riñón es nuevo, así que tu guardaespaldas lo ve como un extraño." },
          { icon: "check", title: "Tacrolimus mantiene la paz", text: "Le dice a tu guardaespaldas que el riñón es de tu equipo, y se calma." },
          { icon: "clock", title: "Constante cada día", text: "Tu equipo de atención eligió tus horas para mantener la paz de día y de noche." },
        ],
        facts: [
          ["¿Por qué a las mismas horas cada día?", "Niveles constantes protegen tu riñón todo el tiempo."],
          ["¿Por qué los análisis de sangre?", "Tu clínica revisa el nivel para que esté en el rango correcto para ti."],
          ["¿Tienes una pregunta sobre tus medicinas?", "Pregunta a tu equipo de atención. Relay nunca hace cambios a tus medicinas."],
        ],
      },
    },
  },
  {
    slug: "mycophenolate",
    name: "Mycophenolate",
    form: "tablet",
    color: "#2563ab",
    content: {
      en: {
        nick: "The Shield",
        hook: "Backs up the Peacekeeper.",
        journey: [
          { icon: "bolt", title: "Your body makes defender cells", text: "Some of these cells could go after your new kidney." },
          { icon: "shield", title: "Mycophenolate slows them down", text: "Your body makes fewer of those cells, so fewer come looking for a fight." },
          { icon: "check", title: "A team with tacrolimus", text: "Two meds work from two sides to protect your kidney." },
        ],
        facts: [
          ["Why two medicines?", "Each one blocks a different part of the attack. Together they work better."],
          ["Have a question about how to take it?", "Ask your care team what's right for you."],
        ],
      },
      es: {
        nick: "El Escudo",
        hook: "Ayuda al Pacificador.",
        journey: [
          { icon: "bolt", title: "Tu cuerpo hace células defensoras", text: "Algunas de esas células podrían atacar tu riñón nuevo." },
          { icon: "shield", title: "El micofenolato las frena", text: "Tu cuerpo hace menos de esas células, así que llegan menos a pelear." },
          { icon: "check", title: "En equipo con tacrolimus", text: "Dos medicinas trabajan desde dos lados para proteger tu riñón." },
        ],
        facts: [
          ["¿Por qué dos medicinas?", "Cada una frena una parte distinta del ataque. Juntas funcionan mejor."],
          ["¿Tienes una pregunta sobre cómo tomarla?", "Pregunta a tu equipo de atención qué es lo mejor para ti."],
        ],
      },
    },
  },
  {
    slug: "prednisone",
    name: "Prednisone",
    form: "tablet",
    color: "#c0603a",
    content: {
      en: {
        nick: "The Firefighter",
        hook: "Calms flare-ups fast.",
        journey: [
          { icon: "flame", title: "Sometimes things flare up", text: "Swelling is your body's alarm. Sometimes the alarm gets too loud." },
          { icon: "shield", title: "Prednisone calms it down", text: "It settles the alarm so a flare-up doesn't get out of hand." },
          { icon: "heart", title: "Your care team is in charge", text: "Only your care team decides how much you take. Never the app." },
        ],
        facts: [
          ["Who decides how much I take?", "Only your care team, based on how you're doing."],
          ["Have a question?", "Write it down and ask at your next visit."],
        ],
      },
      es: {
        nick: "El Bombero",
        hook: "Calma las crisis rápido.",
        journey: [
          { icon: "flame", title: "A veces algo se inflama", text: "La hinchazón es la alarma de tu cuerpo. A veces suena demasiado fuerte." },
          { icon: "shield", title: "La prednisona la calma", text: "Calma la alarma para que la crisis no crezca." },
          { icon: "heart", title: "Tu equipo de atención decide", text: "Solo tu equipo de atención decide cuánto tomas. Nunca la app." },
        ],
        facts: [
          ["¿Quién decide cuánto tomo?", "Solo tu equipo de atención, según cómo estás."],
          ["¿Tienes una pregunta?", "Escríbela y pregúntala en tu próxima visita."],
        ],
      },
    },
  },
];

export function getSampleMed(slug: string) {
  return sampleMeds.find((m) => m.slug === slug) ?? null;
}

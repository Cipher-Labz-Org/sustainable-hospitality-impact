export const SECTIONS = [
  {
    id: "A",
    title: "Sustainable management",
    official:
      "Demonstrate effective sustainable management",
    description:
      "Policy, legal compliance, people, procurement, and how the organization is run.",
  },
  {
    id: "B",
    title: "Community and economy",
    official:
      "Maximize social and economic benefits to the local community and minimize negative impacts",
    description:
      "Local employment, fair work, community support, and the social effects of operations.",
  },
  {
    id: "C",
    title: "Cultural heritage",
    official:
      "Maximize benefits to cultural heritage and minimize negative impacts",
    description:
      "Respectful cultural exchange, heritage protection, and how culture is presented.",
  },
  {
    id: "D",
    title: "Environment",
    official:
      "Maximize environmental benefits and minimize negative impacts",
    description:
      "Energy, water, waste, pollution, biodiversity, and the care of wildlife.",
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export function getSection(id: string) {
  return SECTIONS.find((section) => section.id === id);
}

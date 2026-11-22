export type EventCategory = "holiday" | "religious" | "season" | "commerce" | "culture";

export type DateRule =
  | { kind: "fixed"; month: number; day: number }
  | { kind: "nthWeekday"; month: number; weekday: number; nth: number; offsetDays?: number }
  | { kind: "easter"; offsetDays?: number }
  | { kind: "table"; dates: Readonly<Record<number, string>> };

export interface ThemeEvent {
  id: string;
  name: string;
  category: EventCategory;
  rule: DateRule;
  keywords: readonly string[];
  leadDays?: number;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  holiday: "Hari Libur",
  religious: "Hari Raya",
  season: "Musim",
  commerce: "Belanja",
  culture: "Budaya",
};

const LAST = -1;
const SUNDAY = 0;
const MONDAY = 1;
const THURSDAY = 4;

const fixed = (month: number, day: number): DateRule => ({ kind: "fixed", month, day });

export const THEME_EVENTS: readonly ThemeEvent[] = [
  {
    id: "new-year",
    name: "Tahun Baru",
    category: "holiday",
    rule: fixed(1, 1),
    leadDays: 100,
    keywords: ["new year fireworks", "new years eve party", "champagne toast", "countdown clock", "gold confetti", "happy new year"],
  },
  {
    id: "black-history-month",
    name: "Black History Month",
    category: "culture",
    rule: fixed(2, 1),
    keywords: ["black history month", "african american family", "black business owner", "diverse community"],
  },
  {
    id: "lunar-new-year",
    name: "Lunar New Year",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-02-17", 2027: "2027-02-06", 2028: "2028-01-26" } },
    keywords: ["lunar new year", "red lantern", "red envelope", "year of the goat", "dragon dance", "chinese new year"],
  },
  {
    id: "valentine",
    name: "Valentine",
    category: "commerce",
    rule: fixed(2, 14),
    keywords: ["valentines day", "red roses", "heart balloons", "romantic dinner", "love couple", "valentine gift box"],
  },
  {
    id: "mardi-gras",
    name: "Mardi Gras",
    category: "culture",
    rule: { kind: "easter", offsetDays: -47 },
    keywords: ["mardi gras mask", "carnival parade", "mardi gras beads", "new orleans carnival"],
  },
  {
    id: "ramadan",
    name: "Ramadan",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-02-18", 2027: "2027-02-08", 2028: "2028-01-28" } },
    leadDays: 100,
    keywords: ["ramadan kareem", "islamic lantern", "crescent moon", "iftar table", "arabic pattern", "mosque silhouette"],
  },
  {
    id: "womens-day",
    name: "International Women's Day",
    category: "culture",
    rule: fixed(3, 8),
    keywords: ["international womens day", "women empowerment", "diverse women", "female leadership"],
  },
  {
    id: "eid-al-fitr",
    name: "Eid al-Fitr",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-03-20", 2027: "2027-03-10", 2028: "2028-02-27" } },
    keywords: ["eid mubarak", "eid al fitr", "golden lantern", "islamic greeting card", "muslim family celebration"],
  },
  {
    id: "st-patrick",
    name: "St. Patrick's Day",
    category: "holiday",
    rule: fixed(3, 17),
    keywords: ["st patricks day", "shamrock", "four leaf clover", "leprechaun", "pot of gold", "green beer"],
  },
  {
    id: "spring",
    name: "Musim Semi",
    category: "season",
    rule: fixed(3, 20),
    leadDays: 120,
    keywords: ["spring flowers", "cherry blossom", "tulip field", "spring garden", "spring sale banner", "pastel flowers"],
  },
  {
    id: "holi",
    name: "Holi",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-03-04", 2027: "2027-03-22", 2028: "2028-03-11" } },
    keywords: ["holi festival", "color powder", "happy holi", "colorful splash"],
  },
  {
    id: "easter",
    name: "Paskah",
    category: "religious",
    rule: { kind: "easter" },
    keywords: ["easter eggs", "easter bunny", "easter basket", "egg hunt", "spring chicks", "pastel easter background"],
  },
  {
    id: "earth-day",
    name: "Earth Day",
    category: "culture",
    rule: fixed(4, 22),
    keywords: ["earth day", "save the planet", "renewable energy", "recycling", "green forest", "eco friendly lifestyle"],
  },
  {
    id: "cinco-de-mayo",
    name: "Cinco de Mayo",
    category: "culture",
    rule: fixed(5, 5),
    keywords: ["cinco de mayo", "mexican fiesta", "papel picado", "sombrero", "tacos party"],
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    category: "commerce",
    rule: { kind: "nthWeekday", month: 5, weekday: SUNDAY, nth: 2 },
    keywords: ["mothers day", "mother and daughter", "breakfast in bed", "flower bouquet", "mothers day card"],
  },
  {
    id: "eid-al-adha",
    name: "Eid al-Adha",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-05-27", 2027: "2027-05-17", 2028: "2028-05-05" } },
    keywords: ["eid al adha", "eid adha mubarak", "sheep", "islamic celebration"],
  },
  {
    id: "graduation",
    name: "Musim Wisuda",
    category: "season",
    rule: fixed(5, 20),
    keywords: ["graduation cap", "graduation ceremony", "class of 2027", "college graduate", "diploma"],
  },
  {
    id: "memorial-day",
    name: "Memorial Day",
    category: "holiday",
    rule: { kind: "nthWeekday", month: 5, weekday: MONDAY, nth: LAST },
    keywords: ["memorial day", "american flag", "veterans", "memorial day sale"],
  },
  {
    id: "pride",
    name: "Pride Month",
    category: "culture",
    rule: fixed(6, 1),
    keywords: ["pride month", "rainbow flag", "lgbtq", "pride parade"],
  },
  {
    id: "wedding-season",
    name: "Musim Pernikahan",
    category: "season",
    rule: fixed(6, 1),
    keywords: ["wedding ceremony", "bride and groom", "wedding invitation", "rustic wedding", "wedding flowers"],
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    category: "commerce",
    rule: { kind: "nthWeekday", month: 6, weekday: SUNDAY, nth: 3 },
    keywords: ["fathers day", "father and son", "dad and kids", "bbq grill", "fathers day card"],
  },
  {
    id: "summer",
    name: "Musim Panas",
    category: "season",
    rule: fixed(6, 21),
    leadDays: 120,
    keywords: ["summer vacation", "tropical beach", "pool party", "ice cream", "summer sale", "beach umbrella"],
  },
  {
    id: "independence-day",
    name: "4th of July",
    category: "holiday",
    rule: fixed(7, 4),
    keywords: ["4th of july", "american flag", "fireworks", "patriotic background", "usa independence day", "backyard bbq"],
  },
  {
    id: "back-to-school",
    name: "Back to School",
    category: "commerce",
    rule: fixed(8, 15),
    leadDays: 100,
    keywords: ["back to school", "school supplies", "school bus", "kids classroom", "backpack", "chalkboard"],
  },
  {
    id: "labor-day",
    name: "Labor Day",
    category: "holiday",
    rule: { kind: "nthWeekday", month: 9, weekday: MONDAY, nth: 1 },
    keywords: ["labor day", "labor day sale", "american workers", "end of summer"],
  },
  {
    id: "oktoberfest",
    name: "Oktoberfest",
    category: "culture",
    rule: { kind: "table", dates: { 2026: "2026-09-19", 2027: "2027-09-18", 2028: "2028-09-16" } },
    keywords: ["oktoberfest", "beer festival", "bavarian pattern", "pretzel", "beer mugs"],
  },
  {
    id: "autumn",
    name: "Musim Gugur",
    category: "season",
    rule: fixed(9, 22),
    leadDays: 120,
    keywords: ["autumn leaves", "fall foliage", "pumpkin patch", "cozy autumn", "pumpkin spice latte", "fall background"],
  },
  {
    id: "halloween",
    name: "Halloween",
    category: "holiday",
    rule: fixed(10, 31),
    leadDays: 100,
    keywords: ["halloween pumpkin", "jack o lantern", "haunted house", "trick or treat", "witch hat", "spooky background"],
  },
  {
    id: "diwali",
    name: "Diwali",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" } },
    keywords: ["happy diwali", "diya lamp", "rangoli", "festival of lights"],
  },
  {
    id: "day-of-the-dead",
    name: "Day of the Dead",
    category: "culture",
    rule: fixed(11, 1),
    keywords: ["day of the dead", "sugar skull", "marigold flowers", "dia de los muertos"],
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    category: "holiday",
    rule: { kind: "nthWeekday", month: 11, weekday: THURSDAY, nth: 4 },
    keywords: ["thanksgiving dinner", "roast turkey", "family gathering", "harvest table", "pumpkin pie", "autumn table setting"],
  },
  {
    id: "black-friday",
    name: "Black Friday",
    category: "commerce",
    rule: { kind: "nthWeekday", month: 11, weekday: THURSDAY, nth: 4, offsetDays: 1 },
    leadDays: 100,
    keywords: ["black friday sale", "black friday banner", "shopping bags", "cyber monday", "discount tag"],
  },
  {
    id: "hanukkah",
    name: "Hanukkah",
    category: "religious",
    rule: { kind: "table", dates: { 2026: "2026-12-04", 2027: "2027-12-24", 2028: "2028-12-12" } },
    keywords: ["hanukkah", "menorah", "dreidel", "star of david", "festival of lights"],
  },
  {
    id: "winter",
    name: "Musim Dingin",
    category: "season",
    rule: fixed(12, 21),
    leadDays: 120,
    keywords: ["winter landscape", "snowy forest", "snowflakes", "frozen lake", "cozy cabin", "winter sale", "hot cocoa"],
  },
  {
    id: "christmas",
    name: "Natal",
    category: "religious",
    rule: fixed(12, 25),
    leadDays: 110,
    keywords: [
      "christmas tree",
      "snowman",
      "santa claus",
      "christmas snow",
      "reindeer",
      "gingerbread",
      "christmas lights",
      "christmas ornaments",
      "cozy fireplace",
      "wrapped gifts",
    ],
  },
];

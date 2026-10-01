// Admin/patrakar submission form English categories save karte hain (Politics, Sports...), patrakar dashboard Hindi (राजनीति, खेल...).
// Homepage tabs Hindi/English dono hain — isliye ek hi category ke saare naam ek group me, taaki tab dono tarah ke articles dikhaye.
const CATEGORY_GROUPS: string[][] = [
  ['राजनीति', 'politics', 'political'],
  ['व्यापार', 'business', 'बिज़नेस', 'बिजनेस', 'अर्थव्यवस्था', 'economy'],
  ['स्वास्थ्य', 'health'],
  ['जीवनशैली', 'lifestyle', 'life style'],
  ['राज्य', 'state', 'राज्य / ज़िला', 'ज़िला', 'जिला'],
  ['देश', 'national', 'राष्ट्रीय', 'india'],
  ['अपराध', 'crime'],
  ['खेल', 'sports', 'sport'],
  ['मनोरंजन', 'entertainment'],
  ['तकनीक', 'technology', 'tech', 'टेक्नोलॉजी'],
  ['कृषि', 'agriculture', 'खेती'],
  ['defence', 'रक्षा', 'डिफेंस'],
  ['national security', 'राष्ट्रीय सुरक्षा']
];

const norm = (value: string) => value.trim().toLowerCase();

const groupOf = (value: string) => CATEGORY_GROUPS.find((g) => g.some((name) => norm(name) === norm(value)));

// Tab ki category aur article ki category ek hi group (ya bilkul same naam) ki hain?
export function categoryMatches(tab: string, articleCategory?: string) {
  if (!articleCategory) return false;
  if (norm(tab) === norm(articleCategory)) return true;
  const group = groupOf(tab);
  return !!group && group.some((name) => norm(name) === norm(articleCategory));
}

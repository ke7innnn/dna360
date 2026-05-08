const fs = require('fs');
const data = require('./services.json');
const allowedSlugs = [
  'personal-training',
  'general-fitness',
  'reformer-pilates',
  'spinning',
  'bolly-x-fitness',
  'zumba-fitness',
  'yoga',
  'mat-pilates',
  'mixed-martial-arts'
];
const filteredData = data.filter(s => allowedSlugs.includes(s.slug));

const tsContent = `export interface Service {
  slug: string;
  title: string;
  bannerImage: string;
  images: string[];
  content: string;
  benefits?: string[];
  sessions?: { durationNumber: string; durationUnit: string; sessionText: string }[];
}

export const services: Service[] = ${JSON.stringify(filteredData, null, 2)};

export const getServiceBySlug = (slug: string) => services.find((s) => s.slug === slug);
`;
fs.writeFileSync('data/services.ts', tsContent);
console.log("Filtered data/services.ts to " + filteredData.length + " services.");

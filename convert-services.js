const fs = require('fs');
const data = require('./services.json');
const tsContent = `export interface Service {
  slug: string;
  title: string;
  bannerImage: string;
  images: string[];
  content: string;
  benefits?: string[];
  sessions?: { durationNumber: string; durationUnit: string; sessionText: string }[];
}

export const services: Service[] = ${JSON.stringify(data, null, 2)};
`;
fs.writeFileSync('data/services.ts', tsContent);
console.log("Updated data/services.ts");

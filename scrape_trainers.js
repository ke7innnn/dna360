const fs = require('fs');
const https = require('http'); // The site is http

const trainers = [
  'afzal-shah', 'ajay-pawar', 'aniket-jadhav', 'hemant-shirke', 'kunal-chavan',
  'mandar-shirke', 'mayur-chakke', 'nishant-tawade', 'omkar-khamkar', 'sharvari-godase',
  'shikhar-nagaich', 'siddhesh-walavankar', 'vaibhav-mulik'
];

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrape() {
  const result = [];
  
  for (const slug of trainers) {
    const html = await fetchHtml(`http://www.dna360.in/trainer-${slug}.php`);
    
    const nameMatch = html.match(/<h3 class="name"[^>]*>(.*?)<\/h3>/);
    const expMatch = html.match(/<h3 class="colorblue">EXPERIENCE:<\/h3>\s*<p>(.*?)<\/p>/is);
    const aboutMatch = html.match(/<h3 class="colorblue">ABOUT MY SERVICES:<\/h3>\s*<p>(.*?)<\/p>/is);
    
    // Extract qualifications
    let qualifications = [];
    const qualSection = html.match(/<h3 class="colorblue">QUALIFICATIONS:<\/h3>([\s\S]*?)<h3 class="colorblue">SPECIALITY AREAS:<\/h3>/i);
    if (qualSection) {
      const lis = [...qualSection[1].matchAll(/<li><a>(.*?)<\/a><\/li>/gi)];
      qualifications = lis.map(m => m[1].trim());
    }
    
    // Extract specialties
    let specialties = [];
    const specSection = html.match(/<h3 class="colorblue">SPECIALITY AREAS:<\/h3>([\s\S]*?)(<h3 class="colorblue">ABOUT MY SERVICES:|<section|<div)/i);
    if (specSection) {
      const lis = [...specSection[1].matchAll(/<li><a>(.*?)<\/a>(?:<br>)?<\/li>/gi)];
      specialties = lis.map(m => m[1].trim());
    }

    result.push({
      slug,
      name: nameMatch ? nameMatch[1].trim() : slug,
      experience: expMatch ? expMatch[1].trim() : '',
      about: aboutMatch ? aboutMatch[1].trim() : '',
      qualifications,
      specialties,
      image: `http://www.dna360.in/assets/img/trainer/${slug}.jpg`
    });
  }
  
  fs.writeFileSync('trainers.json', JSON.stringify(result, null, 2));
  console.log('Scraping done!');
}

scrape();

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// All unique image URLs used in the project
const imageUrls = [
  'http://www.dna360.in/assets/img/about-Ice-bath.jpg',
  'http://www.dna360.in/assets/img/about-acclaimed-trainers.jpg',
  'http://www.dna360.in/assets/img/about-assessment-room.jpg',
  'http://www.dna360.in/assets/img/about-dj.jpg',
  'http://www.dna360.in/assets/img/about-dna-cafe.jpg',
  'http://www.dna360.in/assets/img/about-hitachi.jpg',
  'http://www.dna360.in/assets/img/about-meditation-room.jpg',
  'http://www.dna360.in/assets/img/about-spa.jpg',
  'http://www.dna360.in/assets/img/about-sports-nutritionist.jpg',
  'http://www.dna360.in/assets/img/about-steam-shower.jpg',
  'http://www.dna360.in/assets/img/about-top-1.jpg',
  'http://www.dna360.in/assets/img/about-top-2.jpg',
  'http://www.dna360.in/assets/img/bg-programs.jpg',
  'http://www.dna360.in/assets/img/bg-testimonials.jpg',
  'http://www.dna360.in/assets/img/bg-trainer.jpg',
  'http://www.dna360.in/assets/img/contact-header-image.jpg',
  'http://www.dna360.in/assets/img/enquire-now.png',
  'http://www.dna360.in/assets/img/equipment.gif',
  'http://www.dna360.in/assets/img/franchise-top-1.jpg',
  'http://www.dna360.in/assets/img/franchise-top-2.jpg',
  'http://www.dna360.in/assets/img/franchise/after-drawings-01.jpg',
  'http://www.dna360.in/assets/img/franchise/after-drawings-02.jpg',
  'http://www.dna360.in/assets/img/franchise/after-drawings-03.jpg',
  'http://www.dna360.in/assets/img/franchise/after-drawings-04.jpg',
  'http://www.dna360.in/assets/img/franchise/before-drawings-01.jpg',
  'http://www.dna360.in/assets/img/franchise/before-drawings-02.jpg',
  'http://www.dna360.in/assets/img/franchise/before-drawings-03.jpg',
  'http://www.dna360.in/assets/img/franchise/before-drawings-04.jpg',
  'http://www.dna360.in/assets/img/franchise/before-drawings-05.jpg',
  'http://www.dna360.in/assets/img/franchise/facility-services-01.jpg',
  'http://www.dna360.in/assets/img/franchise/facility-services-02.jpg',
  'http://www.dna360.in/assets/img/franchise/franchise-services-01.jpg',
  'http://www.dna360.in/assets/img/franchise/franchise-services-02.jpg',
  'http://www.dna360.in/assets/img/franchise/management-services-01.jpg',
  'http://www.dna360.in/assets/img/franchise/management-services-02.jpg',
  'http://www.dna360.in/assets/img/group-circle-2.svg',
  'http://www.dna360.in/assets/img/header-image.jpg',
  'http://www.dna360.in/assets/img/home2-about-2.jpg',
  'http://www.dna360.in/assets/img/home2-about.jpg',
  'http://www.dna360.in/assets/img/hygiene-clean.jpg',
  'http://www.dna360.in/assets/img/individual-studios.jpg',
  'http://www.dna360.in/assets/img/logo-2.png',
  'http://www.dna360.in/assets/img/rohit-shetty.png',
  'http://www.dna360.in/assets/img/service-header-image.jpg',
  'http://www.dna360.in/assets/img/services/bolly-x-2.jpg',
  'http://www.dna360.in/assets/img/services/general-fitness-2.jpg',
  'http://www.dna360.in/assets/img/services/general-fitness-3.jpg',
  'http://www.dna360.in/assets/img/services/mat-pilates-2.jpg',
  'http://www.dna360.in/assets/img/services/mat-pilates-3.jpg',
  'http://www.dna360.in/assets/img/services/mixed-martial-2.jpg',
  'http://www.dna360.in/assets/img/services/mixed-martial-3.jpg',
  'http://www.dna360.in/assets/img/services/personal-training-2.jpg',
  'http://www.dna360.in/assets/img/services/personal-training-3.jpg',
  'http://www.dna360.in/assets/img/services/reformer-pilates-2.jpg',
  'http://www.dna360.in/assets/img/services/reformer-pilates-3.jpg',
  'http://www.dna360.in/assets/img/services/spinning-2.jpg',
  'http://www.dna360.in/assets/img/services/spinning-3.jpg',
  'http://www.dna360.in/assets/img/services/yoga-2.jpg',
  'http://www.dna360.in/assets/img/services/yoga-3.jpg',
  'http://www.dna360.in/assets/img/services/zumba-2.jpg',
  'http://www.dna360.in/assets/img/square-yellow.svg',
  'http://www.dna360.in/assets/img/sumona-chakravarti.png',
  'http://www.dna360.in/assets/img/surbhi-chandna.png',
  'http://www.dna360.in/assets/img/testimonials-siddhaanth.png',
  'http://www.dna360.in/assets/img/top-notch.jpg',
  'http://www.dna360.in/assets/img/trainer-header-image.jpg',
  'http://www.dna360.in/assets/img/trainer/afzal-shah-2.jpg',
  'http://www.dna360.in/assets/img/trainer/afzal-shah.jpg',
  'http://www.dna360.in/assets/img/trainer/aniket-jadhav.jpg',
  'http://www.dna360.in/assets/img/trainer/hemant-shirke.jpg',
  'http://www.dna360.in/assets/img/trainer/kunal-chavan-2.jpg',
  'http://www.dna360.in/assets/img/trainer/kunal-chavan.jpg',
  'http://www.dna360.in/assets/img/trainer/mandar-shirke-2.jpg',
  'http://www.dna360.in/assets/img/trainer/mandar-shirke.jpg',
  'http://www.dna360.in/assets/img/trainer/mayur-chakke-2.jpg',
  'http://www.dna360.in/assets/img/trainer/mayur-chakke.jpg',
  'http://www.dna360.in/assets/img/trainer/nishant-tawade.jpg',
  'http://www.dna360.in/assets/img/trainer/omkar-khamkar.jpg',
  'http://www.dna360.in/assets/img/trainer/siddhesh-walavankar-2.jpg',
  'http://www.dna360.in/assets/img/trainer/siddhesh-walavankar.jpg',
  'http://www.dna360.in/assets/img/trainer/vaibhav-mulik.jpg',
  'http://www.dna360.in/assets/img/unfettered-space.jpg',
  // gallery images 1-30
  ...Array.from({length: 30}, (_, i) => `http://www.dna360.in/assets/img/gallery/${i+1}.jpg`),
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      process.stdout.write(`  SKIP (exists): ${path.basename(dest)}\n`);
      return resolve();
    }
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        process.stdout.write(`  FAIL ${res.statusCode}: ${url}\n`);
        return resolve();
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        process.stdout.write(`  OK: ${path.basename(dest)}\n`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      process.stdout.write(`  ERR: ${url} - ${err.message}\n`);
      resolve();
    });
  });
}

async function main() {
  const BASE = 'http://www.dna360.in/assets/img/';
  const PUBLIC = './public/images';

  console.log('=== Downloading images ===');
  for (const url of imageUrls) {
    if (!url.includes('/assets/img/')) continue;
    const rel = url.replace(BASE, '');
    const dest = path.join(PUBLIC, rel);
    await downloadFile(url, dest);
  }

  console.log('\n=== Replacing URLs in source files ===');
  const extensions = ['tsx', 'ts', 'css', 'js'];
  const srcDirs = ['app', 'components', 'data', 'styles'];
  
  for (const dir of srcDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const ext of extensions) {
      try {
        execSync(
          `find ${dir} -name "*.${ext}" | xargs sed -i '' 's|http://www\\.dna360\\.in/assets/img/|/images/|g'`,
          { stdio: 'inherit' }
        );
      } catch(e) {}
    }
  }

  console.log('\nDone! All images now served locally from /public/images/');
}

main();

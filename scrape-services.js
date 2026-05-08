const https = require('http');

const fetchHTML = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

async function scrape() {
  try {
    const html = await fetchHTML('http://www.dna360.in/services.php');
    console.log("Fetched services.php, length:", html.length);
    // Find all service links
    const matches = html.match(/<a href="(service-[^"]+)" class="btn">/g);
    const links = [...new Set(matches.map(m => m.match(/href="([^"]+)"/)[1]))];
    console.log("Found links:", links);
    
    const servicesData = [];
    
    for (const link of links) {
      console.log("Fetching", link);
      const pageHtml = await fetchHTML('http://www.dna360.in/' + link);
      
      const slugMatch = link.match(/service-(.+)\.php/);
      if (!slugMatch) continue;
      const slug = slugMatch[1];
      
      // Extract title: <h2 class="title-decor">...</h2>
      const titleMatch = pageHtml.match(/<h2 class="title-decor">([\s\S]*?)<\/h2>/);
      let title = "Unknown Title";
      if (titleMatch) {
         title = titleMatch[1].replace(/<[^>]+>/g, '').trim(); // Remove spans
      }
      
      // Extract banner image: background-image: url(...) in s-header-title
      const bannerMatch = pageHtml.match(/<section class="s-header-title" style="background-image: url\(([^)]+)\)/);
      const bannerImage = bannerMatch ? bannerMatch[1] : '';
      
      // Extract main images (usually two overlapping images like other pages)
      const img1Match = pageHtml.match(/<img src="(assets\/img\/service-[^"]+)" alt="img">/);
      const img2Match = pageHtml.match(/<img src="(assets\/img\/service-[^"]+)" alt="img"/g); // Might need to refine
      // Let's just grab all images in the .s-about section
      const aboutSection = pageHtml.match(/<section class="s-about"[\s\S]*?<\/section>/);
      let images = [];
      if (aboutSection) {
         const imgMatches = aboutSection[0].match(/<img[^>]+src="([^"]+)"/g);
         if (imgMatches) {
           images = imgMatches.map(m => m.match(/src="([^"]+)"/)[1]).filter(src => !src.includes('square-yellow') && !src.includes('tringle'));
         }
      }
      
      // Extract text content
      // usually in <div class="col-md-6 col-lg-7"> or <div class="col-md-6">
      let content = "";
      if (aboutSection) {
         const pMatches = aboutSection[0].match(/<p>([\s\S]*?)<\/p>/g);
         if (pMatches) {
           content = pMatches.map(p => p.replace(/<\/?p>/g, '').trim()).join('\n\n');
         }
      }

      // Extract benefits
      let benefits = [];
      if (aboutSection) {
         const benefitsMatch = aboutSection[0].match(/<ol class="list widget-archive">([\s\S]*?)<\/ol>/);
         if (benefitsMatch) {
            const liMatches = benefitsMatch[1].match(/<li><a>(.*?)<\/a><\/li>/g);
            if (liMatches) {
               benefits = liMatches.map(li => li.replace(/<\/?(li|a)>/g, '').trim());
            }
         }
      }

      // Extract sessions
      let sessions = [];
      const sessionMatches = pageHtml.match(/<div class="about-bottom-item">([\s\S]*?)<\/div>\s*<\/div>/g);
      if (sessionMatches) {
         sessions = sessionMatches.map(sm => {
            const dateMatch = sm.match(/<div class="date">(.*?)<\/div>/);
            const durationMatch = sm.match(/<h4>(.*?)<\/h4>/);
            const sessionCountMatch = sm.match(/<h3>(.*?)<\/h3>/);
            return {
               durationNumber: dateMatch ? dateMatch[1].trim() : '',
               durationUnit: durationMatch ? durationMatch[1].trim() : '',
               sessionText: sessionCountMatch ? sessionCountMatch[1].trim() : ''
            };
         });
      }

      servicesData.push({
        slug,
        title,
        bannerImage: bannerImage.replace('assets/', 'http://www.dna360.in/assets/'),
        images: [...new Set(images.map(img => img.replace('assets/', 'http://www.dna360.in/assets/')))],
        content,
        benefits,
        sessions
      });
    }
    
    require('fs').writeFileSync('services.json', JSON.stringify(servicesData, null, 2));
    console.log("Saved to services.json");
  } catch (err) {
    console.error(err);
  }
}

scrape();

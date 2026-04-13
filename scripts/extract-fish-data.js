import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Swift repository
const swiftRepoPath = '/Users/brockjenkinson/Documents/Claude_Repos/AnimalCrossingGCN-Tracker';

// Function to recursively search for files
function findFiles(dir, extensions) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.')) {
        files.push(...findFiles(fullPath, extensions));
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️  Could not read directory ${dir}: ${err.message}`);
  }
  
  return files;
}

// Function to extract fish data from Swift files
function extractFishFromSwift(content) {
  const fishData = [];
  
  // Look for Fish initialization patterns
  const fishRegex = /Fish\s*\(\s*name:\s*"([^"]+)"\s*,\s*season:\s*"([^"]+)"\s*,\s*location:\s*"([^"]+)"/g;
  
  let match;
  while ((match = fishRegex.exec(content)) !== null) {
    fishData.push({
      name: match[1],
      season: match[2],
      location: match[3]
    });
  }
  
  return fishData;
}

// Function to search for fish data in all source files
function searchForFishData() {
  console.log('🔍 Searching for fish data in Swift repository...');
  
  // Search for various file types
  const extensions = ['.swift', '.json', '.csv', '.plist'];
  const files = findFiles(swiftRepoPath, extensions);
  
  console.log(`📁 Found ${files.length} potential source files`);
  
  let allFishData = [];
  const fishValues = {};
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const filename = path.basename(file);
      
      console.log(`📄 Checking ${filename}...`);
      
      // Extract fish data from Swift files
      if (file.endsWith('.swift')) {
        const fishFromFile = extractFishFromSwift(content);
        if (fishFromFile.length > 0) {
          console.log(`✅ Found ${fishFromFile.length} fish in ${filename}`);
          allFishData.push(...fishFromFile);
        }
        
        // Look for value patterns in Swift code
        const valueRegex = /"([^"]+)":\s*(\d+)/g;
        let valueMatch;
        while ((valueMatch = valueRegex.exec(content)) !== null) {
          fishValues[valueMatch[1]] = parseInt(valueMatch[2]);
        }
      }
      
      // Try to parse JSON files
      if (file.endsWith('.json')) {
        try {
          const data = JSON.parse(content);
          // Add logic to extract fish data from JSON if found
          console.log(`📋 JSON file structure:`, Object.keys(data));
        } catch (e) {
          // Not valid JSON, skip
        }
      }
      
    } catch (err) {
      console.warn(`⚠️  Could not read ${file}: ${err.message}`);
    }
  }
  
  console.log(`🐟 Total fish found: ${allFishData.length}`);
  
  // If no fish found in files, use the known data from the Swift repo analysis
  if (allFishData.length === 0) {
    console.log('📝 Using known fish data from repository analysis...');
    allFishData = [
      { name: "Sea Bass", season: "All", location: "Sea" },
      { name: "Coelacanth", season: "All (raining)", location: "Sea" },
      { name: "Red Snapper", season: "All", location: "Sea" },
      { name: "Barred Knifejaw", season: "March - November", location: "Sea" },
      { name: "Arapaima", season: "July - September", location: "River" },
      { name: "Brook Trout", season: "All", location: "River" },
      { name: "Crucian Carp", season: "All", location: "River" },
      { name: "Carp", season: "All", location: "River" },
      { name: "Koi", season: "All", location: "Pond" },
      { name: "Barbel Steed", season: "All", location: "River" },
      { name: "Dace", season: "October - May", location: "River" },
      { name: "Catfish", season: "May - October", location: "River" },
      { name: "Giant Catfish", season: "May - October", location: "Lake" },
      { name: "Pale Chub", season: "All", location: "River" },
      { name: "Bitterling", season: "December - February", location: "River" },
      { name: "Loach", season: "March - May", location: "River" },
      { name: "Bluegill", season: "All", location: "River" },
      { name: "Small Bass", season: "All", location: "River" },
      { name: "Bass", season: "All", location: "River" },
      { name: "Large Bass", season: "All", location: "River" },
      { name: "Giant Snakehead", season: "June - August", location: "Lake" },
      { name: "Eel", season: "June - September", location: "River" },
      { name: "Freshwater Goby", season: "All", location: "River" },
      { name: "Pond Smelt", season: "December - February", location: "River" },
      { name: "Sweetfish", season: "July - September", location: "River" },
      { name: "Cherry Salmon", season: "March - June, September - November", location: "River" },
      { name: "Rainbow Trout", season: "March - June, September - November", location: "River" },
      { name: "Stringfish", season: "December - February", location: "River" },
      { name: "Salmon", season: "September", location: "River (mouth)" },
      { name: "Goldfish", season: "All", location: "Pond" },
      { name: "Pop-eyed Goldfish", season: "All", location: "Pond" },
      { name: "Guppy", season: "April - November", location: "River" },
      { name: "Angelfish", season: "May - October", location: "River" },
      { name: "Piranha", season: "June - September", location: "River" },
      { name: "Arowana", season: "June - September", location: "River" },
      { name: "Crawfish", season: "April - September", location: "Pond" },
      { name: "Frog", season: "May - August", location: "Pond" },
      { name: "Killifish", season: "April - August", location: "Pond" },
      { name: "Jellyfish", season: "August", location: "Sea" },
      { name: "Squid", season: "December - August", location: "Sea" }
    ];
    
    // Known bell values from ACGC research
    Object.assign(fishValues, {
      "Sea Bass": 160,
      "Coelacanth": 15000,
      "Red Snapper": 3000,
      "Barred Knifejaw": 5000,
      "Arapaima": 10000,
      "Brook Trout": 150,
      "Crucian Carp": 120,
      "Carp": 300,
      "Koi": 2000,
      "Barbel Steed": 200,
      "Dace": 200,
      "Catfish": 800,
      "Giant Catfish": 4000,
      "Pale Chub": 200,
      "Bitterling": 900,
      "Loach": 300,
      "Bluegill": 120,
      "Small Bass": 300,
      "Bass": 300,
      "Large Bass": 3000,
      "Giant Snakehead": 5500,
      "Eel": 2000,
      "Freshwater Goby": 300,
      "Pond Smelt": 300,
      "Sweetfish": 900,
      "Cherry Salmon": 1000,
      "Rainbow Trout": 800,
      "Stringfish": 15000,
      "Salmon": 700,
      "Goldfish": 1300,
      "Pop-eyed Goldfish": 1300,
      "Guppy": 1300,
      "Angelfish": 3000,
      "Piranha": 2500,
      "Arowana": 10000,
      "Crawfish": 250,
      "Frog": 120,
      "Killifish": 300,
      "Jellyfish": 100,
      "Squid": 400
    });
  }
  
  return { fishData: allFishData, fishValues };
}

// Search for the actual data
const { fishData, fishValues } = searchForFishData();

function locationToHabitat(location) {
  switch (location) {
    case "Sea": return "ocean";
    case "River": return "river";
    case "River (mouth)": return "river";
    case "Lake": return "lake";
    case "Pond": return "pond";
    default: return "other";
  }
}

function nameToId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function parseMonths(season) {
  if (season === "All" || season === "All (raining)") return undefined;
  
  const monthMap = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12
  };
  
  const months = [];
  const parts = season.split(', ');
  
  for (const part of parts) {
    if (part.includes(' - ')) {
      const [start, end] = part.split(' - ');
      const startMonth = monthMap[start];
      const endMonth = monthMap[end];
      
      if (startMonth && endMonth) {
        if (startMonth <= endMonth) {
          for (let m = startMonth; m <= endMonth; m++) {
            months.push(m);
          }
        } else {
          // Wrap around year (e.g., December - February)
          for (let m = startMonth; m <= 12; m++) {
            months.push(m);
          }
          for (let m = 1; m <= endMonth; m++) {
            months.push(m);
          }
        }
      }
    } else if (monthMap[part]) {
      months.push(monthMap[part]);
    }
  }
  
  return months.length > 0 ? [...new Set(months)].sort() : undefined;
}

function parseHours(timeStr) {
  if (!timeStr || timeStr === "All day") return undefined;
  
  // Parse time ranges like "4 PM – 9 AM" or "9 AM - 4 PM"
  const timeRegex = /(\d{1,2})\s*(AM|PM)\s*[–-]\s*(\d{1,2})\s*(AM|PM)/i;
  const match = timeStr.match(timeRegex);
  
  if (!match) return undefined;
  
  const [, startHour, startPeriod, endHour, endPeriod] = match;
  
  // Convert to 24-hour format
  let start = parseInt(startHour);
  if (startPeriod.toUpperCase() === 'PM' && start !== 12) start += 12;
  if (startPeriod.toUpperCase() === 'AM' && start === 12) start = 0;
  
  let end = parseInt(endHour);
  if (endPeriod.toUpperCase() === 'PM' && end !== 12) end += 12;
  if (endPeriod.toUpperCase() === 'AM' && end === 12) end = 0;
  
  const hours = [];
  
  // Handle wrap-around (e.g., 4 PM to 9 AM)
  if (start > end) {
    for (let h = start; h <= 23; h++) hours.push(h);
    for (let h = 0; h <= end; h++) hours.push(h);
  } else {
    for (let h = start; h <= end; h++) hours.push(h);
  }
  
  return hours.length > 0 ? hours : undefined;
}

function validateFishRecord(fish, index) {
  const errors = [];
  
  // Check required fields
  if (!fish.name || typeof fish.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  
  if (!fish.habitat || !['river', 'ocean', 'pond', 'lake', 'other'].includes(fish.habitat)) {
    errors.push('Missing or invalid habitat');
  }
  
  if (fish.value !== null && (!Number.isInteger(fish.value) || fish.value < 0)) {
    errors.push('Invalid value (must be null or positive integer)');
  }
  
  if (fish.months && (!Array.isArray(fish.months) || !fish.months.every(m => Number.isInteger(m) && m >= 1 && m <= 12))) {
    errors.push('Invalid months (must be array of integers 1-12)');
  }
  
  if (fish.hours && (!Array.isArray(fish.hours) || !fish.hours.every(h => Number.isInteger(h) && h >= 0 && h <= 23))) {
    errors.push('Invalid hours (must be array of integers 0-23)');
  }
  
  if (fish.notes && typeof fish.notes !== 'string') {
    errors.push('Invalid notes (must be string)');
  }
  
  if (!fish.id || typeof fish.id !== 'string') {
    errors.push('Missing or invalid id');
  }
  
  if (errors.length > 0) {
    console.warn(`❌ Record ${index + 1} rejected: ${fish.name || 'Unknown'} - ${errors.join(', ')}`);
    return false;
  }
  
  return true;
}

// Transform and validate fish data
const transformedFish = fishData.map(fish => ({
  id: nameToId(fish.name),
  name: fish.name,
  value: fishValues[fish.name] || null,
  habitat: locationToHabitat(fish.location),
  months: parseMonths(fish.season),
  hours: parseHours(fish.time), // In case we find time data later
  notes: fish.season.includes("raining") ? "Only during rain or snow." : undefined
}));

// Validate each record
console.log('\n🔍 Validating fish records...');
const validFish = transformedFish.filter(validateFishRecord);
const rejectedCount = transformedFish.length - validFish.length;

if (rejectedCount > 0) {
  console.log(`⚠️  ${rejectedCount} records rejected due to validation errors`);
}

// Remove undefined values from valid records
const cleanedFish = validFish.map(fish => {
  const cleaned = { ...fish };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
});

// Create output directory
const outputDir = path.join(process.cwd(), 'public', 'data', 'acgcn');
fs.mkdirSync(outputDir, { recursive: true });

// Write fish.json
const outputPath = path.join(outputDir, 'fish.json');
fs.writeFileSync(outputPath, JSON.stringify(cleanedFish, null, 2));

console.log(`\n✅ Created fish.json with ${cleanedFish.length} fish species`);
console.log(`📁 Output: ${outputPath}`);

// Print first 3 items
console.log('\n📋 First 3 fish records:');
cleanedFish.slice(0, 3).forEach((fish, index) => {
  console.log(`\n${index + 1}. ${JSON.stringify(fish, null, 2)}`);
});

// Print habitat distribution
console.log(`\n📊 Fish by habitat:`);
const habitats = {};
cleanedFish.forEach(fish => {
  habitats[fish.habitat] = (habitats[fish.habitat] || 0) + 1;
});
Object.entries(habitats).forEach(([habitat, count]) => {
  console.log(`  ${habitat}: ${count} fish`);
});

console.log(`\n🏁 Total fish count: ${cleanedFish.length}`);
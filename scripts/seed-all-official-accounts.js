const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local if present
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Key. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generateSecureTempPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(12);
  let pwd = 'Dna#';
  for (let i = 0; i < 12; i++) {
    pwd += chars[randomBytes[i] % chars.length];
  }
  return pwd + '!9';
}

// Canonical roster without static passwords
const allAccounts = [
  // ─── Executive & Admin ───
  { email: 'admin@dna360.in', name: 'Executive Admin', role: 'owner_admin', roleName: 'Owner / Executive' },
  { email: 'keith.mktg@dna360.in', name: 'Keith Shah', role: 'owner_admin', roleName: 'Administrator' },
  { email: 'swapnil.hr@dna360.in', name: 'Swapnil Borhade', role: 'hr_head', roleName: 'HR Head' },
  { email: 'monica.sales@dna360.in', name: 'Monica Picholla', role: 'sales_head', roleName: 'Asst Sales Head' },

  // ─── Front Desk & Operations ───
  { email: 'frontdesk@dna360.in', name: 'Front Desk Operations', role: 'front_desk', roleName: 'Front Desk Supervisor' },
  { email: 'surendra.fc@dna360.in', name: 'Surendra Chaudhary', role: 'sales_consultant', roleName: 'Fitness Consultant' },
  { email: 'krish.fc@dna360.in', name: 'Krish Rawat', role: 'sales_consultant', roleName: 'Fitness Consultant' },
  { email: 'pallavi.fc@dna360.in', name: 'Pallavi More', role: 'sales_consultant', roleName: 'Fitness Consultant' },
  { email: 'nisha.fc@dna360.in', name: 'Nisha Jadhav', role: 'sales_consultant', roleName: 'Fitness Consultant' },
  { email: 'suresh.sup@dna360.in', name: 'Suresh Patil', role: 'supervisor', roleName: 'Supervisor' },

  // ─── Coaches & Trainers ───
  { email: 'rajesh.coach@dna360.in', name: 'Rajesh Poojary', role: 'head_trainer', roleName: 'Head Trainer' },
  { email: 'aftab.coach@dna360.in', name: 'Aftab Memon', role: 'head_trainer', roleName: 'Head Trainer' },
  { email: 'pramod.trainer@dna360.in', name: 'Pramod Sawant', role: 'general_trainer', roleName: 'General Trainer' },
  { email: 'jateen.trainer@dna360.in', name: 'Jateen Kadam', role: 'general_trainer', roleName: 'General Trainer' },
  { email: 'aditya.trainer@dna360.in', name: 'Aditya Shinde', role: 'general_trainer', roleName: 'General Trainer' },
  { email: 'vaibhav.trainer@dna360.in', name: 'Vaibhav Pawar', role: 'general_trainer', roleName: 'General Trainer' },
  { email: 'hussain.trainer@dna360.in', name: 'Hussain Shaikh', role: 'general_trainer', roleName: 'General Trainer' },
  { email: 'liladhar.masseur@dna360.in', name: 'Liladhar Gaikwad', role: 'masseur', roleName: 'Masseur' },

  // ─── Clients & Members ───
  { email: 'member@dna360.in', name: 'Aarav Mehta', role: 'member', roleName: 'Platinum Member', member_code: 'DNA-0412' },
  { email: 'priya.sharma@dna360.in', name: 'Priya Sharma', role: 'member', roleName: 'Annual Member', member_code: 'DNA-0413' },
  { email: 'vikram.singh@dna360.in', name: 'Vikram Singh', role: 'member', roleName: 'Pilates Member', member_code: 'DNA-0414' },
  { email: 'ananya.patel@dna360.in', name: 'Ananya Patel', role: 'member', roleName: 'PT Member', member_code: 'DNA-0415' },
  { email: 'rohan.verma@gmail.com', name: 'Rohan Verma', role: 'member', roleName: 'Expired Member', member_code: 'DNA-0416' },
];

async function seedAll() {
  console.log('Fetching existing users from Supabase Auth...');
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error('List error:', listErr.message);
    process.exit(1);
  }

  const existingMap = new Map((listData.users || []).map(u => [u.email.toLowerCase(), u]));

  console.log(`Found ${existingMap.size} existing users. Provisioning roster (${allAccounts.length} accounts)...\n`);
  console.log('=== ONE-TIME PROVISIONED CREDENTIALS (OUTPUT TO STDOUT ONLY — NEVER WRITTEN TO FILE) ===');

  for (const acc of allAccounts) {
    const emailKey = acc.email.toLowerCase();
    const existing = existingMap.get(emailKey);
    const envKey = 'SEED_PASSWORD_' + acc.email.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const tempPassword = process.env[envKey] || process.env.SEED_DEFAULT_PASSWORD || generateSecureTempPassword();

    // Print once to stdout
    console.log(`[CREDENTIAL] Account: ${acc.email} | Temporary Password: ${tempPassword} | must_change_password: true`);

    const meta = {
      role: acc.role,
      name: acc.name,
      roleName: acc.roleName,
      must_change_password: true,
      ...(acc.member_code ? { member_code: acc.member_code } : {}),
    };

    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, {
        password: tempPassword,
        user_metadata: meta,
        email_confirm: true,
      });
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: meta,
      });
      if (error) console.error(`  Error creating ${acc.email}:`, error.message);
    }
  }

  console.log('\nSUCCESS: All accounts hardened with secure temporary credentials and mandatory password change flag.');
}

seedAll();

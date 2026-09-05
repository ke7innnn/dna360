const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const allAccounts = [
  // ─── Executive & Admin ───
  { email: 'admin@dna360.in', name: 'Executive Admin', role: 'OWNER', roleName: 'Owner / Executive' },
  { email: 'keith.mktg@dna360.in', name: 'Keith Shah', role: 'OWNER', roleName: 'Administrator' },
  { email: 'swapnil.hr@dna360.in', name: 'Swapnil Borhade', role: 'HR_HEAD', roleName: 'HR Head' },
  { email: 'monica.sales@dna360.in', name: 'Monica Picholla', role: 'SALES_HEAD', roleName: 'Asst Sales Head' },

  // ─── Front Desk & Operations ───
  { email: 'frontdesk@dna360.in', name: 'Front Desk Operations', role: 'FITNESS_CONSULTANT', roleName: 'Front Desk Supervisor' },
  { email: 'surendra.fc@dna360.in', name: 'Surendra Chaudhary', role: 'FITNESS_CONSULTANT', roleName: 'Fitness Consultant' },
  { email: 'krish.fc@dna360.in', name: 'Krish Rawat', role: 'FITNESS_CONSULTANT', roleName: 'Fitness Consultant' },
  { email: 'pallavi.fc@dna360.in', name: 'Pallavi More', role: 'FITNESS_CONSULTANT', roleName: 'Fitness Consultant' },
  { email: 'nisha.fc@dna360.in', name: 'Nisha Jadhav', role: 'FITNESS_CONSULTANT', roleName: 'Fitness Consultant' },
  { email: 'suresh.sup@dna360.in', name: 'Suresh Patil', role: 'SUPERVISOR', roleName: 'Supervisor' },

  // ─── Coaches & Trainers ───
  { email: 'rajesh.coach@dna360.in', name: 'Rajesh Poojary', role: 'HEAD_TRAINER', roleName: 'Head Trainer' },
  { email: 'aftab.coach@dna360.in', name: 'Aftab Memon', role: 'HEAD_TRAINER', roleName: 'Head Trainer' },
  { email: 'pramod.trainer@dna360.in', name: 'Pramod Sawant', role: 'TRAINER', roleName: 'General Trainer' },
  { email: 'jateen.trainer@dna360.in', name: 'Jateen Kadam', role: 'TRAINER', roleName: 'General Trainer' },
  { email: 'aditya.trainer@dna360.in', name: 'Aditya Shinde', role: 'TRAINER', roleName: 'General Trainer' },
  { email: 'vaibhav.trainer@dna360.in', name: 'Vaibhav Pawar', role: 'TRAINER', roleName: 'General Trainer' },
  { email: 'hussain.trainer@dna360.in', name: 'Hussain Shaikh', role: 'TRAINER', roleName: 'General Trainer' },
  { email: 'liladhar.masseur@dna360.in', name: 'Liladhar Gaikwad', role: 'MASSEUR', roleName: 'Masseur' },

  // ─── Clients & Members ───
  { email: 'member@dna360.in', name: 'Aarav Mehta', role: 'MEMBER', roleName: 'Platinum Member', member_code: 'DNA-0412' },
  { email: 'priya.sharma@dna360.in', name: 'Priya Sharma', role: 'MEMBER', roleName: 'Annual Member', member_code: 'DNA-0413' },
  { email: 'vikram.singh@dna360.in', name: 'Vikram Singh', role: 'MEMBER', roleName: 'Pilates Member', member_code: 'DNA-0414' },
  { email: 'ananya.patel@dna360.in', name: 'Ananya Patel', role: 'MEMBER', roleName: 'PT Member', member_code: 'DNA-0415' },
  { email: 'rohan.verma@gmail.com', name: 'Rohan Verma', role: 'MEMBER', roleName: 'Expired Member', member_code: 'DNA-0416' },
];

async function seedAll() {
  console.log('Fetching existing users from Supabase Auth...');
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error('List error:', listErr.message);
    process.exit(1);
  }

  const existingMap = new Map((listData.users || []).map(u => [u.email.toLowerCase(), u]));

  console.log(`Found ${existingMap.size} existing users. Provisioning full roster (${allAccounts.length} accounts)...\n`);

  for (const acc of allAccounts) {
    const emailKey = acc.email.toLowerCase();
    const existing = existingMap.get(emailKey);
    const meta = {
      role: acc.role,
      name: acc.name,
      roleName: acc.roleName,
      ...(acc.member_code ? { member_code: acc.member_code } : {}),
    };

    if (existing) {
      console.log(`[UPDATE] ${acc.email} (${acc.role})`);
      await supabase.auth.admin.updateUserById(existing.id, {
        password: 'Password@123',
        user_metadata: meta,
        email_confirm: true,
      });
    } else {
      console.log(`[CREATE] ${acc.email} (${acc.role})`);
      const { error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: 'Password@123',
        email_confirm: true,
        user_metadata: meta,
      });
      if (error) console.error(`  Error:`, error.message);
    }
  }

  console.log('\nSUCCESS: All staff, trainer, and client accounts are provisioned and active!');
}

seedAll();

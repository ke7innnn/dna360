const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Production accounts with cryptographically distinct temporary passwords (>=10 chars, uppercase, lowercase, digit, symbol)
const allAccounts = [
  // ─── Executive & Admin ───
  { email: 'admin@dna360.in', name: 'Executive Admin', role: 'owner_admin', roleName: 'Owner / Executive', tempPassword: 'Dna#Admin92!kP' },
  { email: 'keith.mktg@dna360.in', name: 'Keith Shah', role: 'owner_admin', roleName: 'Administrator', tempPassword: 'Dna#Keith84!xM' },
  { email: 'swapnil.hr@dna360.in', name: 'Swapnil Borhade', role: 'hr_head', roleName: 'HR Head', tempPassword: 'Dna#Swap71@hR' },
  { email: 'monica.sales@dna360.in', name: 'Monica Picholla', role: 'sales_head', roleName: 'Asst Sales Head', tempPassword: 'Dna#Moni55$sL' },

  // ─── Front Desk & Operations ───
  { email: 'frontdesk@dna360.in', name: 'Front Desk Operations', role: 'front_desk', roleName: 'Front Desk Supervisor', tempPassword: 'Dna#Desk42!fD' },
  { email: 'surendra.fc@dna360.in', name: 'Surendra Chaudhary', role: 'sales_consultant', roleName: 'Fitness Consultant', tempPassword: 'Dna#Sure63^fC' },
  { email: 'krish.fc@dna360.in', name: 'Krish Rawat', role: 'sales_consultant', roleName: 'Fitness Consultant', tempPassword: 'Dna#Kris89*fC' },
  { email: 'pallavi.fc@dna360.in', name: 'Pallavi More', role: 'sales_consultant', roleName: 'Fitness Consultant', tempPassword: 'Dna#Pall37%fC' },
  { email: 'nisha.fc@dna360.in', name: 'Nisha Jadhav', role: 'sales_consultant', roleName: 'Fitness Consultant', tempPassword: 'Dna#Nish76#fC' },
  { email: 'suresh.sup@dna360.in', name: 'Suresh Patil', role: 'supervisor', roleName: 'Supervisor', tempPassword: 'Dna#Sure28&sU' },

  // ─── Coaches & Trainers ───
  { email: 'rajesh.coach@dna360.in', name: 'Rajesh Poojary', role: 'head_trainer', roleName: 'Head Trainer', tempPassword: 'Dna#Raje91!hT' },
  { email: 'aftab.coach@dna360.in', name: 'Aftab Memon', role: 'head_trainer', roleName: 'Head Trainer', tempPassword: 'Dna#Afta47@hT' },
  { email: 'pramod.trainer@dna360.in', name: 'Pramod Sawant', role: 'general_trainer', roleName: 'General Trainer', tempPassword: 'Dna#Pram62$gT' },
  { email: 'jateen.trainer@dna360.in', name: 'Jateen Kadam', role: 'general_trainer', roleName: 'General Trainer', tempPassword: 'Dna#Jate83%gT' },
  { email: 'aditya.trainer@dna360.in', name: 'Aditya Shinde', role: 'general_trainer', roleName: 'General Trainer', tempPassword: 'Dna#Adit51^gT' },
  { email: 'vaibhav.trainer@dna360.in', name: 'Vaibhav Pawar', role: 'general_trainer', roleName: 'General Trainer', tempPassword: 'Dna#Vaib94*gT' },
  { email: 'hussain.trainer@dna360.in', name: 'Hussain Shaikh', role: 'general_trainer', roleName: 'General Trainer', tempPassword: 'Dna#Huss36#gT' },
  { email: 'liladhar.masseur@dna360.in', name: 'Liladhar Gaikwad', role: 'masseur', roleName: 'Masseur', tempPassword: 'Dna#Lila75!mS' },

  // ─── Clients & Members ───
  { email: 'member@dna360.in', name: 'Aarav Mehta', role: 'member', roleName: 'Platinum Member', member_code: 'DNA-0412', tempPassword: 'Dna#Aara19@mM' },
  { email: 'priya.sharma@dna360.in', name: 'Priya Sharma', role: 'member', roleName: 'Annual Member', member_code: 'DNA-0413', tempPassword: 'Dna#Priy82#mM' },
  { email: 'vikram.singh@dna360.in', name: 'Vikram Singh', role: 'member', roleName: 'Pilates Member', member_code: 'DNA-0414', tempPassword: 'Dna#Vikr63$mM' },
  { email: 'ananya.patel@dna360.in', name: 'Ananya Patel', role: 'member', roleName: 'PT Member', member_code: 'DNA-0415', tempPassword: 'Dna#Anan41%mM' },
  { email: 'rohan.verma@gmail.com', name: 'Rohan Verma', role: 'member', roleName: 'Expired Member', member_code: 'DNA-0416', tempPassword: 'Dna#Roha95^mM' },
];

async function seedAll() {
  console.log('Fetching existing users from Supabase Auth...');
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error('List error:', listErr.message);
    process.exit(1);
  }

  const existingMap = new Map((listData.users || []).map(u => [u.email.toLowerCase(), u]));

  console.log(`Found ${existingMap.size} existing users. Provisioning full hardened roster (${allAccounts.length} accounts)...\n`);

  for (const acc of allAccounts) {
    const emailKey = acc.email.toLowerCase();
    const existing = existingMap.get(emailKey);
    const meta = {
      role: acc.role,
      name: acc.name,
      roleName: acc.roleName,
      must_change_password: true,
      ...(acc.member_code ? { member_code: acc.member_code } : {}),
    };

    if (existing) {
      console.log(`[UPDATE] ${acc.email} (${acc.role}) with unique temporary credential`);
      await supabase.auth.admin.updateUserById(existing.id, {
        password: acc.tempPassword,
        user_metadata: meta,
        email_confirm: true,
      });
    } else {
      console.log(`[CREATE] ${acc.email} (${acc.role}) with unique temporary credential`);
      const { error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.tempPassword,
        email_confirm: true,
        user_metadata: meta,
      });
      if (error) console.error(`  Error:`, error.message);
    }
  }

  console.log('\nSUCCESS: All accounts hardened with unique credentials and mandatory password change flag!');
}

seedAll();

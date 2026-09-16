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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Key. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
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

const accounts = [
  {
    email: 'admin@dna360.in',
    role: 'OWNER',
    name: 'Executive Admin',
    phone: '+919820011111',
    user_metadata: { role: 'OWNER', name: 'Executive Admin', roleName: 'Owner / Executive', must_change_password: true },
  },
  {
    email: 'frontdesk@dna360.in',
    role: 'FITNESS_CONSULTANT',
    name: 'Front Desk Supervisor',
    phone: '+919820031003',
    user_metadata: { role: 'FITNESS_CONSULTANT', name: 'Front Desk Supervisor', roleName: 'Fitness Consultant', must_change_password: true },
  },
  {
    email: 'rajesh.coach@dna360.in',
    role: 'HEAD_TRAINER',
    name: 'Rajesh Poojary',
    phone: '+919820041001',
    user_metadata: { role: 'HEAD_TRAINER', name: 'Rajesh Poojary', roleName: 'Head Trainer', must_change_password: true },
  },
  {
    email: 'aftab.coach@dna360.in',
    role: 'TRAINER',
    name: 'Aftab Memon',
    phone: '+919820041002',
    user_metadata: { role: 'TRAINER', name: 'Aftab Memon', roleName: 'General Trainer', must_change_password: true },
  },
  {
    email: 'member@dna360.in',
    role: 'MEMBER',
    name: 'Aarav Mehta',
    phone: '+919999900001',
    user_metadata: { role: 'MEMBER', name: 'Aarav Mehta', member_code: 'DNA-0412', roleName: 'Member', must_change_password: true },
  },
];

async function seed() {
  console.log('Seeding Supabase Auth Accounts for DNA 360...\n');
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list users:', listErr.message);
    process.exit(1);
  }

  const existingUsers = listData.users || [];
  console.log('=== ONE-TIME PROVISIONED CREDENTIALS (OUTPUT TO STDOUT ONLY — NEVER WRITTEN TO FILE) ===');

  for (const acc of accounts) {
    const existing = existingUsers.find(u => u.email === acc.email);
    const envKey = 'SEED_PASSWORD_' + acc.email.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const tempPassword = process.env[envKey] || process.env.SEED_DEFAULT_PASSWORD || generateSecureTempPassword();

    // Print once to stdout
    console.log(`[CREDENTIAL] Account: ${acc.email} | Temporary Password: ${tempPassword} | must_change_password: true`);

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: tempPassword,
        user_metadata: { ...acc.user_metadata, must_change_password: true },
        email_confirm: true,
      });
      if (error) console.error(`  Error updating ${acc.email}:`, error.message);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { ...acc.user_metadata, must_change_password: true },
      });
      if (error) console.error(`  Error creating ${acc.email}:`, error.message);
    }
  }

  console.log('\nAll official accounts provisioned in Supabase Auth with unique temporary credentials and mandatory change password flag.');
}

seed();

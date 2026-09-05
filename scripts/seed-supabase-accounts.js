const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  {
    email: 'admin@dna360.in',
    password: 'Password@123',
    role: 'OWNER',
    name: 'Executive Admin',
    phone: '+919820011111',
    user_metadata: { role: 'OWNER', name: 'Executive Admin', roleName: 'Owner / Executive' },
  },
  {
    email: 'frontdesk@dna360.in',
    password: 'Password@123',
    role: 'FITNESS_CONSULTANT',
    name: 'Front Desk Supervisor',
    phone: '+919820031003',
    user_metadata: { role: 'FITNESS_CONSULTANT', name: 'Front Desk Supervisor', roleName: 'Fitness Consultant' },
  },
  {
    email: 'rajesh.coach@dna360.in',
    password: 'Password@123',
    role: 'HEAD_TRAINER',
    name: 'Rajesh Poojary',
    phone: '+919820041001',
    user_metadata: { role: 'HEAD_TRAINER', name: 'Rajesh Poojary', roleName: 'Head Trainer' },
  },
  {
    email: 'aftab.coach@dna360.in',
    password: 'Password@123',
    role: 'TRAINER',
    name: 'Aftab Memon',
    phone: '+919820041002',
    user_metadata: { role: 'TRAINER', name: 'Aftab Memon', roleName: 'General Trainer' },
  },
  {
    email: 'member@dna360.in',
    password: 'Password@123',
    role: 'MEMBER',
    name: 'Aarav Mehta',
    phone: '+919999900001',
    user_metadata: { role: 'MEMBER', name: 'Aarav Mehta', member_code: 'DNA-0412', roleName: 'Member' },
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

  for (const acc of accounts) {
    const existing = existingUsers.find(u => u.email === acc.email);

    if (existing) {
      console.log(`[EXISTING] Updating ${acc.email} (${acc.role})...`);
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: acc.password,
        user_metadata: acc.user_metadata,
        email_confirm: true,
      });
      if (error) console.error(`  Error updating ${acc.email}:`, error.message);
      else console.log(`  Updated ${acc.email} successfully.`);
    } else {
      console.log(`[NEW] Provisioning ${acc.email} (${acc.role})...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: acc.user_metadata,
      });
      if (error) {
        console.error(`  Error creating ${acc.email}:`, error.message);
      } else {
        console.log(`  Created ${acc.email} successfully with ID: ${data.user.id}`);
      }
    }
  }

  console.log('\nAll 5 official accounts provisioned in Supabase Auth successfully!');
}

seed();

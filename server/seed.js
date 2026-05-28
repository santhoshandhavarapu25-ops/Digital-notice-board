const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { Client } = require('pg')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const seedData = require('./database/seedData')

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed PostgreSQL')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  })

  const schemaPath = path.join(__dirname, 'database', 'schema.sql')
  const seedPath = path.join(__dirname, 'database', 'seed.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  const seedSql = fs.readFileSync(seedPath, 'utf8')

  await client.connect()

  try {
    await client.query(schemaSql)
    await client.query(seedSql)

    const college = seedData.colleges[0]
    const passwordMap = new Map(
      seedData.users.map((user) => [user.email, bcrypt.hashSync(user.password, 10)]),
    )

    for (const user of seedData.users) {
      await client.query(
        `INSERT INTO users (
          college_id,
          role,
          full_name,
          email,
          password_hash,
          college_code,
          branch,
          year,
          roll_number,
          phone_number,
          address,
          website,
          interests,
          avatar_url
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (college_id, email) DO UPDATE SET
          role = EXCLUDED.role,
          full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          college_code = EXCLUDED.college_code,
          branch = EXCLUDED.branch,
          year = EXCLUDED.year,
          roll_number = EXCLUDED.roll_number,
          phone_number = EXCLUDED.phone_number,
          address = EXCLUDED.address,
          website = EXCLUDED.website,
          interests = EXCLUDED.interests,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = NOW()`,
        [
          college.id,
          user.role,
          user.fullName,
          user.email,
          passwordMap.get(user.email),
          user.collegeCode,
          user.branch || null,
          user.year || null,
          user.rollNumber || null,
          user.phoneNumber || null,
          user.address || college.address,
          user.website || college.website,
          user.interests || null,
          user.avatarUrl || null,
        ],
      )
    }

    for (const department of seedData.departments) {
      await client.query(
        `INSERT INTO departments (
          id,
          college_id,
          name,
          code,
          lead_name,
          permission_level
        ) VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (college_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          lead_name = EXCLUDED.lead_name,
          permission_level = EXCLUDED.permission_level,
          updated_at = NOW()`,
        [
          department.id,
          department.collegeId,
          department.name,
          department.code,
          department.leadName,
          department.permissionLevel,
        ],
      )
    }

    for (const category of seedData.categories) {
      await client.query(
        `INSERT INTO categories (
          id,
          college_id,
          name,
          description,
          icon,
          color
        ) VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (college_id, name) DO UPDATE SET
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          updated_at = NOW()`,
        [
          category.id,
          category.collegeId,
          category.name,
          category.description,
          category.icon,
          category.color,
        ],
      )
    }

    console.log('✅ PostgreSQL schema and seed data applied successfully')
  } finally {
    await client.end()
  }
}

seedDatabase().catch((error) => {
  console.error('❌ PostgreSQL seeding failed:', error)
  process.exit(1)
})

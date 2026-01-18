const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting full setup...\n');

  // Step 1: Start Docker Compose
  console.log('📦 Step 1: Starting Docker Compose...');
  try {
    execSync('docker-compose up -d', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Docker Compose started\n');
  } catch (error) {
    console.error('❌ Failed to start Docker Compose:', error.message);
    process.exit(1);
  }

  // Step 2: Wait for database to be ready
  console.log('⏳ Step 2: Waiting for database to be ready...');
  const maxAttempts = 30;
  let attempts = 0;
  let dbReady = false;

  while (attempts < maxAttempts && !dbReady) {
    try {
      execSync('docker exec timereporting-postgres pg_isready -U postgres', { 
        stdio: 'ignore',
        cwd: __dirname + '/..' 
      });
      dbReady = true;
      console.log('✅ Database is ready\n');
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        process.stdout.write('.');
        await sleep(1000);
      }
    }
  }

  if (!dbReady) {
    console.error('\n❌ Database did not become ready in time');
    process.exit(1);
  }

  // Step 3: Generate Prisma Client
  console.log('🔧 Step 3: Generating Prisma Client...');
  try {
    execSync('npm run prisma:generate -w backend', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Prisma Client generated\n');
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client:', error.message);
    process.exit(1);
  }

  // Step 4: Run migrations
  console.log('🗄️  Step 4: Running database migrations...');
  try {
    execSync('npm run prisma:migrate -w backend -- --name init', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Migrations completed\n');
  } catch (error) {
    // Migration might already exist, that's okay - check if it's a different error
    const errorOutput = error.message || error.toString();
    if (errorOutput.includes('already exists') || errorOutput.includes('already applied')) {
      console.log('ℹ️  Migration already exists, skipping...\n');
    } else {
      console.error('❌ Failed to run migrations:', errorOutput);
      // Don't exit - migrations might be fine
    }
  }

  // Step 5: Seed database
  console.log('🌱 Step 5: Seeding database...');
  try {
    execSync('npm run prisma:seed -w backend', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Database seeded\n');
  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
    process.exit(1);
  }

  console.log('🎉 Setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   Run: npm run dev:all');
  console.log('   This will start backend, frontend_user, and frontend_admin\n');
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

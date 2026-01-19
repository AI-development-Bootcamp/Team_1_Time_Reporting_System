const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');
const net = require('net');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Find an available port starting from startPort
async function findAvailablePort(startPort = 5432, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  return null;
}

// Update docker-compose.yml with the selected port
function updateDockerComposePort(port) {
  const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
  let content = readFileSync(dockerComposePath, 'utf8');
  // Replace the port mapping
  content = content.replace(/"\d+:5432"/, `"${port}:5432"`);
  writeFileSync(dockerComposePath, content, 'utf8');
}

// Update backend/.env with the correct DATABASE_URL
function updateBackendEnv(port) {
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  const databaseUrl = `postgresql://postgres:postgres@localhost:${port}/timereporting?schema=public`;
  
  let content = '';
  if (existsSync(envPath)) {
    content = readFileSync(envPath, 'utf8');
  }
  
  // Update or add DATABASE_URL
  if (content.includes('DATABASE_URL=')) {
    content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
  } else {
    content += `\nDATABASE_URL="${databaseUrl}"\n`;
  }
  
  writeFileSync(envPath, content, 'utf8');
}

async function main() {
  console.log('🚀 Starting full setup...\n');

  // Step 1: Install dependencies for all workspaces
  console.log('📦 Step 1: Installing dependencies for all workspaces...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Dependencies installed for root, backend, frontend_user, and frontend_admin\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }

  // Step 2: Check if Docker Desktop is running
  console.log('🐳 Step 2: Checking if Docker Desktop is running...');
  try {
    execSync('docker info', { stdio: 'ignore', cwd: __dirname + '/..' });
    console.log('✅ Docker Desktop is running\n');
  } catch (error) {
    console.error('❌ Docker Desktop is not running!');
    console.error('   Please start Docker Desktop and try again.');
    console.error('   On Windows: Open Docker Desktop application');
    console.error('   On Mac: Open Docker Desktop application');
    console.error('   On Linux: Start Docker service (sudo systemctl start docker)\n');
    process.exit(1);
  }

  // Step 3: Stop existing containers (if any) to free up ports
  console.log('🛑 Step 3: Stopping existing containers (if any)...');
  try {
    execSync('docker-compose down', { stdio: 'ignore', cwd: __dirname + '/..' });
    console.log('✅ Existing containers stopped\n');
  } catch (error) {
    // Ignore errors - containers might not exist
    console.log('ℹ️  No existing containers to stop\n');
  }

  // Step 4: Find available port for PostgreSQL
  console.log('🔍 Step 4: Finding available PostgreSQL port (starting from 5432)...');
  const selectedPort = await findAvailablePort(5432, 10);
  
  if (!selectedPort) {
    console.error('❌ Could not find an available port (tried 5432-5441)');
    process.exit(1);
  }

  if (selectedPort !== 5432) {
    console.log(`⚠️  Port 5432 is occupied, using port ${selectedPort} instead`);
  } else {
    console.log('✅ Port 5432 is available');
  }
  
  // Always update docker-compose.yml and .env with the selected port
  updateDockerComposePort(selectedPort);
  updateBackendEnv(selectedPort);
  console.log(`📝 Configured PostgreSQL to use port ${selectedPort}\n`);

  // Step 5: Start Docker Compose
  console.log('🐳 Step 5: Starting Docker Compose...');
  try {
    execSync('docker-compose up -d', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Docker Compose started\n');
  } catch (error) {
    console.error('❌ Failed to start Docker Compose:', error.message);
    process.exit(1);
  }

  // Step 6: Wait for database to be ready
  console.log('⏳ Step 6: Waiting for database to be ready...');
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

  // Step 7: Generate Prisma Client
  console.log('🔧 Step 7: Generating Prisma Client...');
  try {
    execSync('npm run prisma:generate -w backend', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Prisma Client generated\n');
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client:', error.message);
    process.exit(1);
  }

  // Step 6: Run migrations
  console.log('🗄️  Step 6: Running database migrations...');
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

  // Step 9: Seed database
  console.log('🌱 Step 9: Seeding database...');
  try {
    execSync('npm run prisma:seed -w backend', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✅ Database seeded\n');
  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
    process.exit(1);
  }

  console.log('🎉 Setup completed successfully!');
  console.log(`\n📝 Database running on port: ${selectedPort}`);
  console.log('\n📝 Next steps:');
  console.log('   Run: npm run dev:all');
  console.log('   This will start backend, frontend_user, and frontend_admin\n');
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

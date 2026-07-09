const fs = require('fs');
const path = require('path');

const targetDb = process.argv[2];
if (targetDb !== 'sqlite' && targetDb !== 'postgresql') {
  console.error("Please specify 'sqlite' or 'postgresql'");
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../server/prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error("Prisma schema not found at:", schemaPath);
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf8');

if (targetDb === 'sqlite') {
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log("Switched schema database provider to sqlite.");
} else {
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log("Switched schema database provider to postgresql.");
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log("Database switch operation completed successfully.");

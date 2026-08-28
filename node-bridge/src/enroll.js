const { capture } = require("./scannerService");

const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function enroll() {
  const name = process.argv[2];
  if (!name) {
    console.log("Usage: node src/enroll.js <finger_name>");
    console.log("Example: node src/enroll.js right_index");
    process.exit(1);
  }

  const angles = [
    { label: "Place finger STRAIGHT (centered)", suffix: "straight" },
    { label: "Tilt finger slightly LEFT",        suffix: "tilted_left" },
    { label: "Tilt finger slightly RIGHT",       suffix: "tilted_right" },
  ];

  console.log(`\nEnrolling: ${name}\n`);

  for (const angle of angles) {
    await ask(`Press Enter when ready to scan — ${angle.label}`);
    const fileId = `${name}_${angle.suffix}`;
    const result = await capture(fileId, "");
    if (result.error) {
      console.log(`  Failed: ${result.status}\n`);
      const retry = await ask("Try again? (y/n): ");
      if (retry.toLowerCase() !== "y") {
        console.log("Skipping this angle.");
        continue;
      }
      const retryResult = await capture(fileId, "");
      if (retryResult.error) {
        console.log(`  Still failed: ${retryResult.status}. Moving on.\n`);
        continue;
      }
      console.log(`  Saved: ${fileId}.xyt\n`);
    } else {
      console.log(`  Saved: ${fileId}.xyt\n`);
    }
  }

  rl.close();
  console.log("Enrollment complete. Files in .db/minut/:");
  const fs = require("fs");
  const path = require("path");
  const files = fs.readdirSync(path.resolve("./.db/minut"))
    .filter(f => f.startsWith(name) && f.endsWith(".xyt"));
  files.forEach(f => console.log(`  ${f}`));
}

enroll().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

const { capture } = require("./scannerService");
const { MINUT_DIR } = require("./store");
const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function enroll() {
  const name = process.argv[2];
  if (!name) {
    console.log("Usage: node src/enroll.js <member_id_or_name>");
    console.log("Example: node src/enroll.js 2f158922-80a3-4722-b7c6-c7ec97d70ca0");
    process.exit(1);
  }

  const angles = [
    { label: "Place finger STRAIGHT (centered)", suffix: "straight" },
    { label: "Tilt finger slightly LEFT",        suffix: "tilted_left" },
    { label: "Tilt finger slightly RIGHT",       suffix: "tilted_right" },
  ];

  console.log(`\nEnrolling: ${name}\nTarget Directory: ${MINUT_DIR}\n`);

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
      console.log(`  Saved: ${fileId}.xyt -> ${MINUT_DIR}\n`);
    } else {
      console.log(`  Saved: ${fileId}.xyt -> ${MINUT_DIR}\n`);
    }
  }

  rl.close();
  console.log(`Enrollment complete. Files in ${MINUT_DIR}:`);
  const files = fs.readdirSync(MINUT_DIR)
    .filter(f => f.startsWith(name) && f.endsWith(".xyt"));
  files.forEach(f => console.log(`  ${f}`));
}

enroll().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});

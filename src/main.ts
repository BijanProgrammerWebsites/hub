import fs from "node:fs/promises";

import { workflows } from "./data/workflows";
import { generate } from "./utils/generate";

async function main(): Promise<void> {
  for (const workflow of workflows) {
    await fs.writeFile(
      `.github/workflows/${workflow.filename}`,
      generate(workflow) + "\n",
    );
  }
}

main().then();

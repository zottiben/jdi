import { defineCommand } from "citty";
import { consola } from "consola";
import { resolve } from "path";
import { detectProjectType } from "../utils/detect-project";
import { readAdapter } from "../utils/adapter";
import { spawnClaude } from "../utils/claude";

export const quickCommand = defineCommand({
  meta: {
    name: "quick",
    description: "Make a focused change using Claude Code",
  },
  args: {
    description: {
      type: "positional",
      description: "What to change",
      required: true,
    },
    output: {
      type: "string",
      description: "Write prompt to file instead of stdout",
    },
    print: {
      type: "boolean",
      description: "Print the prompt to stdout instead of executing",
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const projectType = await detectProjectType(cwd);
    const adapter = await readAdapter(cwd);

    const qualityGates = adapter?.quality_gates
      ? Object.entries(adapter.quality_gates)
          .map(([name, cmd]) => `- ${name}: \`${cmd}\``)
          .join("\n")
      : "- Run any existing test suite";

    const prompt = [
      `# Quick Change`,
      ``,
      `## Task`,
      `${args.description}`,
      ``,
      `## Context`,
      `- Working directory: ${cwd}`,
      `- Project type: ${projectType}`,
      ``,
      `## Instructions`,
      `1. Make the minimal change needed to accomplish the task`,
      `2. Keep changes focused — do not refactor surrounding code`,
      `3. Follow existing code patterns and conventions`,
      ``,
      `## Verification`,
      qualityGates,
      ``,
      `## Commit`,
      `When done, create a conventional commit describing the change.`,
    ].join("\n");

    if (args.output) {
      await Bun.write(resolve(cwd, args.output), prompt);
      consola.success(`Prompt written to ${args.output}`);
    } else if (args.print) {
      console.log(prompt);
    } else {
      const { exitCode } = await spawnClaude(prompt, { cwd });
      if (exitCode !== 0) {
        consola.error(`Claude exited with code ${exitCode}`);
        process.exit(exitCode);
      }
    }
  },
});

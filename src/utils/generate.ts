import { Workflow, WorkflowInput, WorkflowSecret } from "../types/workflow";

const artifact = "artifact-${{ github.repository_id }}.tar.gz";
const www = "/var/www/${{ inputs.domain }}/html/$BASE_HREF";

export function generate(workflow: Workflow): string {
  return join([
    generateName(workflow),
    "",
    generateOn(workflow),
    "",
    generateJobs(workflow),
  ]);
}

function generateName(workflow: Workflow): string {
  return `name: ${workflow.name}`;
}

function generateOn(workflow: Workflow): string {
  return join([
    "on:",
    indent("workflow_call:"),
    indent(indent(generateInputs(workflow))),
    indent(indent(generateSecrets(workflow))),
  ]);
}

function generateInputs(workflow: Workflow): string {
  const inputs: WorkflowInput[] = [
    { name: "domain", type: "string", required: true },
    { name: "base-href", type: "string", required: true },
  ];

  if (workflow.deploy.type === "process") {
    inputs.push(
      { name: "process-name", type: "string", required: true },
      { name: "port", type: "string", required: true },
    );
  }

  if (workflow.extraInputs) {
    inputs.push(...workflow.extraInputs);
  }

  return join([
    "inputs:",
    ...inputs.map((input) => indent(generateInput(input))),
  ]);
}

function generateInput(input: WorkflowInput): string {
  return join([
    `${input.name}:`,
    indent(`type: ${input.type}`),
    indent(`required: ${input.required}`),
  ]);
}

function generateSecrets(workflow: Workflow): string {
  const secrets: WorkflowSecret[] = [
    { name: "SERVER_HOST", required: true },
    { name: "SERVER_USERNAME", required: true },
    { name: "SERVER_PORT", required: true },
    { name: "SERVER_SSH_KEY", required: true },
  ];

  workflow.build.envSecrets?.forEach((secret) =>
    secrets.push({ name: secret, required: false }),
  );

  workflow.deploy.envSecrets?.forEach((secret) =>
    secrets.push({ name: secret, required: false }),
  );

  if (workflow.extraSecrets) {
    secrets.push(...workflow.extraSecrets);
  }

  return join([
    "secrets:",
    ...secrets.map((secret) => indent(generateSecret(secret))),
  ]);
}

function generateSecret(secret: WorkflowSecret): string {
  return join([`${secret.name}:`, indent(`required: ${secret.required}`)]);
}

function generateJobs(workflow: Workflow): string {
  return join([
    "jobs:",
    indent(generateBuildJob(workflow)),
    "",
    indent(generateDeployJob(workflow)),
  ]);
}

function generateBuildJob(workflow: Workflow): string {
  return join([
    "build:",
    indent("runs-on: ubuntu-latest"),
    "",
    indent("steps:"),
    indent(indent(generateBuildJobSteps(workflow))),
  ]);
}

function generateBuildJobSteps(workflow: Workflow): string {
  return join([
    "- uses: actions/checkout@v7",
    "",
    generateBuildJobEnvStep(workflow),
    "",
    generateBuildJobNpmStep(workflow),
    "",
    generateBuildJobPrepareArtifactStep(workflow),
    "",
    "- name: Compress Artifact",
    indent(`run: tar -czf ${artifact} -C ${workflow.build.path} .`),
    "",
    "- uses: actions/upload-artifact@v7",
    indent("with:"),
    indent(indent("name: artifact")),
    indent(indent(`path: ${artifact}`)),
  ]);
}

function generateBuildJobEnvStep(workflow: Workflow): string | null {
  if (!workflow.build.envSecrets?.length) {
    return null;
  }

  return join([
    "- name: Fill Out the .env File",
    indent("run: |"),
    workflow.build.envSecrets.map((secret) =>
      indent(indent(`printf '%s' "$\{{ secrets.${secret} }}" > ".env"`)),
    ),
  ]);
}

function generateBuildJobNpmStep(workflow: Workflow): string | null {
  if (workflow.build.skipNpmBuild) {
    return null;
  }

  return join([
    "- uses: actions/setup-node@v7",
    indent("with:"),
    indent(indent(`node-version: "${workflow.build.nodeVersion ?? 24}"`)),
    indent(indent('cache: "npm"')),
    "",
    "- name: Install Dependencies",
    indent("run: npm ci"),
    "",
    "- name: Build",
    indent("run: npm run build"),
  ]);
}

function generateBuildJobPrepareArtifactStep(
  workflow: Workflow,
): string | null {
  if (!workflow.build.prepareArtifact?.length) {
    return null;
  }

  return join([
    "- name: Prepare Artifact",
    indent("run: |"),
    indent(indent(join([workflow.build.prepareArtifact]))),
  ]);
}

function generateDeployJob(workflow: Workflow): string {
  return join([
    "deploy:",
    indent("runs-on: ubuntu-latest"),
    indent("needs: build"),
    "",
    indent("steps:"),
    indent(indent(generateDeployJobSteps(workflow))),
  ]);
}

function generateDeployJobSteps(workflow: Workflow): string {
  return join([
    "- name: Run Commands on Server Using SSH",
    indent("uses: appleboy/ssh-action@v1"),
    indent("with:"),
    indent(indent("host: ${{ secrets.SERVER_HOST }}")),
    indent(indent("username: ${{ secrets.SERVER_USERNAME }}")),
    indent(indent("port: ${{ secrets.SERVER_PORT }}")),
    indent(indent("key: ${{ secrets.SERVER_SSH_KEY }}")),
    indent(indent("script: |")),
    indent(indent(indent(generateDeployJobSshScript(workflow)))),
  ]);
}

function generateDeployJobSshScript(workflow: Workflow): string {
  return join([
    generateDeployJobBaseHrefNormalizer(workflow),
    "",
    'APP_DIR="$HOME/websites/${{ inputs.domain }}"',
    'TEMP_DIR="$HOME/websites/.temp/${{ inputs.domain }}"',
    "",
    'rm -rf "$TEMP_DIR"',
    'mkdir -p "$TEMP_DIR"',
    "",
    'rm -rf "$APP_DIR"',
    'mkdir -p "$APP_DIR"',
    "",
    'gh run download ${{ github.run_id }} -R ${{ github.repository }} -n artifact -D "$TEMP_DIR"',
    "",
    `tar -xzf "$TEMP_DIR/${artifact}" -C "$APP_DIR"`,
    'rm -rf "TEMP_DIR"',
    "",
    'cd "$APP_DIR"',
    "",
    generateDeployJobEnvStep(workflow),
    "",
    "shopt -s dotglob",
    `rm -rf ${www}`,
    `mkdir -p ${www}`,
    `mv ./* ${www}`,
    "shopt -u dotglob",
    "",
    workflow.deploy.type === "process"
      ? generateDeployJobProcessScript(workflow)
      : null,
  ]);
}

function generateDeployJobBaseHrefNormalizer(workflow: Workflow): string {
  return join([
    'BASE_HREF="${{ inputs.base-href }}"',
    'BASE_HREF="${BASE_HREF#/}"',
    'BASE_HREF="${BASE_HREF%/}"',
  ]);
}

function generateDeployJobEnvStep(workflow: Workflow): string | null {
  if (!workflow.deploy.envSecrets?.length) {
    return null;
  }

  return join([
    workflow.deploy.envSecrets.map(
      (secret) => `printf '%s' "$\{{ secrets.${secret} }}" > ".env"`,
    ),
  ]);
}

function generateDeployJobProcessScript(workflow: Workflow): string {
  return join([
    `cd ${www}`,
    "",
    'if pm2 describe "${{ inputs.process-name }}" >/dev/null 2>&1; then',
    indent(
      'PORT=${{ inputs.port }} pm2 restart "${{ inputs.process-name }}" --update-env',
    ),
    "else",
    indent(
      'PORT=${{ inputs.port }} pm2 start server.js --name "${{ inputs.process-name }}"',
    ),
    "fi",
    "pm2 save",
  ]);
}

function indent(text: string, count: number = 2): string {
  return text
    .split("\n")
    .map((line) => " ".repeat(count) + line)
    .map((line) => (/^\s+$/.test(line) ? "" : line))
    .join("\n");
}

function join(parts: (string | string[] | null)[]): string {
  return parts
    .flat()
    .filter((part) => part !== null)
    .join("\n")
    .replaceAll(/\n{2,}/g, "\n\n")
    .trimEnd();
}

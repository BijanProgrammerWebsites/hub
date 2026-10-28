import { Workflow, WorkflowEnv } from "../types/workflow";

const nextjsEnvs: WorkflowEnv[] = [
  { secretName: "ENV_FILE", filename: ".env" },
  { secretName: "ENV_LOCAL_FILE", filename: ".env.local" },
];

const monorepoNextjsEnvs: WorkflowEnv[] = nextjsEnvs.map((env) => ({
  ...env,
  filename: `\${{ inputs.app-path }}/${env.filename}`,
}));

export const workflows: Workflow[] = [
  {
    filename: "deploy-angular.yml",
    name: "Deploy Angular",
    extraInputs: [{ name: "project-name", type: "string", required: true }],
    build: { path: "dist/${{ inputs.project-name }}" },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-as-is.yml",
    name: "Deploy As Is",
    build: { path: ".", skipNpmBuild: true },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-astro.yml",
    name: "Deploy Astro",
    build: { path: "dist" },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-docusaurus.yml",
    name: "Deploy Docusaurus",
    build: { path: "build" },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-express.yml",
    name: "Deploy Express",
    build: { path: "dist" },
    deploy: {
      type: "process",
      envs: [{ secretName: "ENV_FILE", filename: ".env" }],
    },
  },
  {
    filename: "deploy-monorepo-docusaurus.yml",
    name: "Deploy Monorepo Docusaurus",
    monorepo: true,
    build: { path: "${{ inputs.app-path }}/build" },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-monorepo-nestjs.yml",
    name: "Deploy Monorepo NestJS",
    monorepo: true,
    build: {
      path: "${{ inputs.app-path }}/bundle",
      prepareArtifact: [
        "cd ${{ inputs.app-path }}",
        "pnpm dlx @vercel/ncc build dist/main.js -o bundle",
        "mv bundle/index.js bundle/main.js",
      ],
    },
    deploy: {
      type: "process",
      envs: [{ secretName: "ENV_FILE", filename: ".env" }],
      processEntryFile: "main.js",
    },
  },
  {
    filename: "deploy-monorepo-nextjs.yml",
    name: "Deploy Monorepo Next.js",
    monorepo: true,
    build: {
      path: "${{ inputs.app-path }}/.next/standalone",
      envs: monorepoNextjsEnvs,
      prepareArtifact: [
        "cd ${{ inputs.app-path }}",
        "[ -d public ] && cp -r public .next/standalone/${{ inputs.app-path }}/",
        "[ -d .next/static ] && mkdir -p .next/standalone/${{ inputs.app-path }}/.next",
        "[ -d .next/static ] && cp -r .next/static .next/standalone/${{ inputs.app-path }}/.next/",
        "rm -f .next/standalone/${{ inputs.app-path }}/.env*",
      ],
    },
    deploy: {
      type: "process",
      envs: monorepoNextjsEnvs,
      processEntryFile: "${{ inputs.app-path }}/server.js",
    },
  },
  {
    filename: "deploy-monorepo-nextjs-export.yml",
    name: "Deploy Monorepo Next.js Export",
    monorepo: true,
    build: {
      path: "${{ inputs.app-path }}/out",
      envs: monorepoNextjsEnvs,
    },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-nestjs.yml",
    name: "Deploy NestJS",
    build: {
      path: "bundle",
      prepareArtifact: [
        "npx --yes @vercel/ncc build dist/main.js -o bundle",
        "mv bundle/index.js bundle/main.js",
      ],
    },
    deploy: {
      type: "process",
      envs: [{ secretName: "ENV_FILE", filename: ".env" }],
      processEntryFile: "main.js",
    },
  },
  {
    filename: "deploy-nextjs.yml",
    name: "Deploy Next.js",
    build: {
      path: ".next/standalone",
      envs: nextjsEnvs,
      prepareArtifact: [
        "[ -d public ] && cp -r public .next/standalone/",
        "[ -d .next/static ] && mkdir -p .next/standalone/.next",
        "[ -d .next/static ] && cp -r .next/static .next/standalone/.next/",
        "rm -f .next/standalone/.env*",
      ],
    },
    deploy: {
      type: "process",
      envs: nextjsEnvs,
    },
  },
  {
    filename: "deploy-nextjs-export.yml",
    name: "Deploy Next.js Export",
    build: {
      path: "out",
      envs: nextjsEnvs,
    },
    deploy: { type: "static" },
  },
  {
    filename: "deploy-vite.yml",
    name: "Deploy Vite",
    build: {
      path: "dist",
      envs: [{ secretName: "ENV_FILE", filename: ".env" }],
    },
    deploy: { type: "static" },
  },
];

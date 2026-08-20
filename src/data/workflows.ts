import { Workflow } from "../types/workflow";

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
      prepareArtifact: [
        "[ -d public ] && cp -r public .next/standalone/",
        "[ -d .next/static ] && mkdir -p .next/standalone/.next",
        "[ -d .next/static ] && cp -r .next/static .next/standalone/.next/",
      ],
    },
    deploy: {
      type: "process",
      envs: [
        { secretName: "ENV_FILE", filename: ".env" },
        { secretName: "ENV_LOCAL_FILE", filename: ".env.local" },
      ],
    },
  },
  {
    filename: "deploy-nextjs-export.yml",
    name: "Deploy Next.js Export",
    build: {
      path: "out",
      envs: [
        { secretName: "ENV_FILE", filename: ".env" },
        { secretName: "ENV_LOCAL_FILE", filename: ".env.local" },
      ],
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

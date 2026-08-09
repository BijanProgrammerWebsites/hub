export type Workflow = {
  filename: string;
  name: string;
  extraInputs?: WorkflowInput[];
  extraSecrets?: WorkflowSecret[];
  build: {
    path: string;
    envSecrets?: string[];
    skipNpmBuild?: boolean;
    nodeVersion?: number;
    prepareArtifact?: string[];
  };
  deploy: {
    type: "static" | "process";
    envSecrets?: string[];
    processEntryFile?: string;
  };
};

export type WorkflowInput = {
  name: string;
  type: "string";
  required: boolean;
};

export type WorkflowSecret = {
  name: string;
  required: boolean;
};

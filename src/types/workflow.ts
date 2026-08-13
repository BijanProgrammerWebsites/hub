export type Workflow = {
  filename: string;
  name: string;
  extraInputs?: WorkflowInput[];
  extraSecrets?: WorkflowSecret[];
  build: {
    path: string;
    envs?: WorkflowEnv[];
    skipNpmBuild?: boolean;
    nodeVersion?: number;
    prepareArtifact?: string[];
  };
  deploy: {
    type: "static" | "process";
    envs?: WorkflowEnv[];
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

export type WorkflowEnv = {
  secretName: string;
  filename: string;
};

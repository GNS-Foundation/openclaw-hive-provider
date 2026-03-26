import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";
import { applyHiveConfig, HIVE_DEFAULT_MODEL_REF } from "./onboard.js";
import { buildHiveProvider } from "./provider-catalog.js";

const PROVIDER_ID = "geiant-hive";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "GEIANT Hive Provider",
  description:
    "Distributed AI inference on your own hardware. " +
    "Zero cloud dependency. Zero per-token cost. " +
    "Data never leaves your jurisdiction. " +
    "Powered by the GNS Protocol — hive.geiant.com",
  provider: {
    label: "GEIANT Hive",
    docsPath: "/providers/geiant-hive",
    auth: [
      {
        methodId: "api-key",
        label: "Hive API key (cloud gateway)",
        hint: "Get your key at hive.geiant.com/keys",
        optionKey: "hiveApiKey",
        flagName: "--hive-api-key",
        envVar: "HIVE_API_KEY",
        promptMessage: "Enter your Hive API key (from hive.geiant.com/keys)",
        defaultModel: HIVE_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyHiveConfig(cfg),
        wizard: {
          groupLabel: "GEIANT Hive (Cloud)",
        },
      },
      {
        methodId: "local",
        label: "Hive Local Gateway (no key needed)",
        hint: "Connect to local swarm at localhost:8080",
        optionKey: "hiveLocalUrl",
        flagName: "--hive-url",
        envVar: "HIVE_URL",
        promptMessage:
          "Enter your local Hive gateway URL (default: http://localhost:8080)",
        defaultModel: HIVE_DEFAULT_MODEL_REF,
        applyConfig: (cfg) => applyHiveConfig(cfg),
        wizard: {
          groupLabel: "GEIANT Hive (Local Swarm)",
        },
      },
    ],
    catalog: {
      buildProvider: buildHiveProvider,
    },
  },
});

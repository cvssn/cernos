import { vitestConfig } from "@cernos/vitest-config/node";
import { defineConfig, mergeConfig } from "vite";

export default mergeConfig(defineConfig({}), vitestConfig);

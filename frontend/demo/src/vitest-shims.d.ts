declare module 'vitest/config' {
  export interface UserConfigExport {
    [key: string]: unknown;
  }

  export function defineConfig(config: UserConfigExport): UserConfigExport;
}

declare module '@vitejs/plugin-react' {
  export default function pluginReact(): unknown;
}

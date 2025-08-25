# Configuration Files - Emlinh Remotion

Thư mục này chứa tất cả các file cấu hình cho Remotion project.

## Cấu trúc

- `remotion.config.ts` - Remotion framework configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `mcp-config.json` - MCP integration configuration
- `.prettierrc` - Code formatting configuration

## Quy tắc

- Config files phải có type safety khi có thể
- Sử dụng TypeScript cho complex configurations
- Validate config trước khi build/render
- Document tất cả config options
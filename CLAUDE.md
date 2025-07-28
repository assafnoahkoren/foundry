## Project Configuration
- All the ports of this project should start with 1300X.

## Development Best Practices
- Make sure to create or update tests according to new logics and after any change run tests
- After making changes, run `npm run check` from the root directory to run all TypeScript and ESLint checks in parallel
- Fix any TypeScript or ESLint errors before considering the task complete
- When solving TypeScript or ESLint errors, investigate root causes holistically:
  - Don't just add type assertions (`as`), `@ts-ignore`, or `eslint-disable` comments
  - Maybe database migrations need to be run (`npm run prisma:migrate`)
  - Check if types need to be regenerated (e.g., after Prisma schema changes)
  - Consider if the error indicates a real logic issue that needs proper fixing

## UI Development
- When creating UI layouts, assign meaningful IDs to different sections and components for better accessibility and testing
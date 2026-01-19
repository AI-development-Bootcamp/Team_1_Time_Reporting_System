# CI/CD Workflow & Testing Guide

This document outlines the development flow and testing standards for the Team 1 Time Reporting System. Following these steps ensures high code quality and smooth deployments.

## 1. Development Lifecycle

We follow a branch-based workflow to manage features and releases:

| Step | Action | Branch | CI/CD Impact |
| :--- | :--- | :--- | :--- |
| **1** | Create Feature Branch | `feature/your-feature` | — |
| **2** | Develop & Write Unit Tests | `feature/your-feature` | **Unit Tests** run on every push. |
| **3** | Open PR to `dev` | `feature/*` → `dev` | **Unit + Integration Tests** run. |
| **4** | Merge to `dev` | `dev` | Code is ready for staging. |
| **5** | Open PR to `main` | `dev` → `main` | **Full Test Suite** runs. |
| **6** | Merge to `main` | `main` | **Deploy** to Production (Render). |

---

## 2. Testing Standards

We use **Vitest** for all testing needs. Our goal is **60% code coverage**.

### Unit Tests (Colocated)
*   **Purpose**: Test individual functions, utilities, or components in isolation.
*   **Location**: Place these in the `src/` directory, directly next to the file being tested.
*   **Naming**: `[filename].test.ts` or `[filename].test.tsx`.
*   **Example**: 
    - Source: `backend/src/utils/calculator.ts`
    - Test: `backend/src/utils/calculator.test.ts`

### Integration Tests (Separate Folder)
*   **Purpose**: Test workflows that involve multiple parts of the system (e.g., API → Database).
*   **Location**: Place these in the `tests/integration/` folder of each workspace.
*   **Naming**: `[workflow_name].test.ts`.
*   **Example**: `backend/tests/integration/auth_flow.test.ts`

---

## 3. Useful Commands

Run these commands from the **root directory**:

| Command | Description |
| :--- | :--- |
| `npm run test:unit` | Runs all unit tests (fast, for local development). |
| `npm run test:integration` | Runs all integration tests. |
| `npm run test:all` | Runs everything (Unit + Integration). |

---

## 4. CI/CD Failures

If your CI/CD pipeline fails in GitHub:
1.  **Check Logs**: Click on the "Actions" tab in GitHub to see which specific test failed.
2.  **Prisma**: Ensure you have run `npm run prisma:generate -w backend` if you modified the database schema.
3.  **Local Sync**: Run `npm run test:all` locally to reproduce and fix the error before pushing again.

---

*Note: All layouts must support Hebrew (RTL) and use Mantine UI components. Always use Day.js for date manipulations.*

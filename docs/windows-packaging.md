# Windows Store Packaging Guide

This document outlines the workflow for packaging the Throughline Progressive Web App (PWA) for the Microsoft Store as a native Windows App (MSIX/AppX bundle).

Because official offline command-line tools for PWA-to-Windows generation have been deprecated, the standard and supported workflow relies on using the PWABuilder web service to generate the package, combined with GitHub Actions (`msstore-cli`) for automated submission.

## 1. Prerequisites

- A Microsoft Partner Center developer account.
- The app must be registered in the Microsoft Partner Center to reserve its name and get the **Package Identity** (Publisher ID, Package Name, etc.).
- Your PWA must be deployed to a production URL with a valid SSL certificate (e.g., `https://throughline.app`).

## 2. Generating the Package (PWABuilder)

When you need to update the core Windows wrapper (e.g., changing the app name, icons, or primary URL), you must regenerate the `.msixbundle`.

1. Navigate to [PWABuilder](https://www.pwabuilder.com/).
2. Enter the production URL of the Throughline PWA (e.g., `https://throughline.app`) and click **Start**.
3. PWABuilder will analyze the site and grade the manifest. Ensure all checks pass.
4. Click **Package for Stores** and select **Windows**.
5. In the Windows package options, click **Options** to configure the package:
   - **Package ID**: The unique ID from Partner Center (e.g., `9PDNH55ZKNZ7`).
   - **Publisher Display Name**: Your publisher name.
   - **Publisher ID**: Your publisher ID (starts with `CN=...`).
   - **Version**: Increment this version number for new store releases.
6. Click **Generate** and download the resulting `.zip` file.
7. Extract the downloaded `.zip`. Inside you will find:
   - A `windows` folder containing the source files (if you wish to open it in Visual Studio).
   - An `.msixbundle` file. **This is the package you will submit to the store.**

## 3. Testing the Package Locally

Before submitting to the store, it's crucial to test the generated package on a local Windows machine.

1. In the extracted PWABuilder `.zip`, locate the `test_install.ps1` script or the `.msixbundle` file.
2. Open PowerShell as Administrator.
3. Run the installation script:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\test_install.ps1
   ```
4. Alternatively, you can double-click the `.msixbundle` to invoke the App Installer (ensure Developer Mode is enabled in Windows Settings).
5. Open the installed "Throughline" app from your Start menu and verify it launches the PWA correctly.

## 4. Submitting to the Microsoft Store

Submission is automated via a GitHub Action located at `.github/workflows/microsoft-store.yml`.

### Setup

To enable automated publishing, you must configure the following Secrets in your GitHub repository:
- `MSSTORE_TENANT_ID`: Your Azure AD tenant ID.
- `MSSTORE_CLIENT_ID`: The App Registration Client ID created for Partner Center API access.
- `MSSTORE_CLIENT_SECRET`: The client secret for the App Registration.

### Publishing Workflow

1. Once the `.msixbundle` is generated from PWABuilder, place it in a designated releases folder or upload it to a GitHub Release.
2. The GitHub Action is configured to trigger manually via `workflow_dispatch` (or automatically on release creation).
3. The Action uses `microsoft/setup-msstore-cli` to authenticate and run:
   ```bash
   msstore publish
   ```
4. Monitor the Partner Center dashboard to track certification and publication status.

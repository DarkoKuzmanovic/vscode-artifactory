# VSCode Artifactory

VSCode Artifactory is a straightforward extension that simplifies the process of generating a comprehensive snapshot of your codebase. It was initially developed to create markdown files for importing as artifacts into Claude's project knowledge, but it can be used for various purposes.

The extension extracts code from your project files and compiles it into a single markdown file. This makes it easy to review your project structure, share the codebase with others, or feed it into AI assistants like Claude or ChatGPT for analysis.

With VSCode Artifactory, you can quickly create a concise representation of your entire project, saving time and effort in the process.

## Features

- Extracts code from various file types supported by VS Code
- Generates a file tree of the extracted files
- Respects .gitignore and .vscodeignore files
- Excludes binary files and specific lock files
- Provides a progress indicator during extraction
- Configurable output file name

## Usage

1. Open your project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the command palette
3. Type "VSCode Artifactory: Create Artifact" and select it
4. Wait for the extraction process to complete
5. Find the generated markdown file (default: `extracted_code.md`) in your project root

## Extension Settings

This extension contributes the following settings:

* `vscode-artifactory.outputFile`: The name of the output file for extracted code (default: "extracted_code.md")

## Requirements

- Visual Studio Code version 1.93.0 or higher

## Known Issues

Currently, there are no known issues. If you encounter any problems, please report them on our GitHub repository.

## Release Notes

### 0.5.1

- Changed displayName

### 0.5.0

Initial release of VSCode Artifactory:

- Basic code extraction functionality
- File tree generation
- Progress indicator
- Configurable output file name

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the [MIT License](LICENSE.md).

**Enjoy using VSCode Artifactory!**

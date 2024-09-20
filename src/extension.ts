import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

const config = vscode.workspace.getConfiguration('vscode-artifactory');
const outputFile = config.get('outputFile', 'extracted_code.md');
const userIncludeExtensions: string[] = config.get('includeExtensions', []);
const userExcludeExtensions: string[] = config.get('excludeExtensions', []);
const maxFileSizeKB = config.get('maxFileSizeKB', 1024);

const normalizeExtensions = (extensions: string[]): Set<string> => {
    return new Set(
        extensions.map(ext => ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`)
    );
};

const USER_INCLUDE_EXTENSIONS = normalizeExtensions(userIncludeExtensions);
const USER_EXCLUDE_EXTENSIONS = normalizeExtensions(userExcludeExtensions);

const CODING_LANGUAGES = new Set([
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'go',
    'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'dart', 'lua',
    'powershell', 'shellscript', 'sql', 'html', 'css', 'less', 'scss',
    'json', 'xml', 'yaml', 'markdown', 'plaintext'
]);

const BINARY_FILE_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    '.zip', '.rar', '.7z', '.tar', '.gz', '.exe', '.dll',
    '.so', '.dylib', '.class', '.jar', '.war', '.ear',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv'
]);

const EXCLUDED_FILES = new Set([
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'Gemfile.lock',
    'poetry.lock',
    'Cargo.lock'
]);

const extensionCache = new Map<string, string>();
function getFileExtension(filePath: string): string {
    if (!extensionCache.has(filePath)) {
        extensionCache.set(filePath, path.extname(filePath).toLowerCase());
    }
    return extensionCache.get(filePath)!;
}

function isBinaryFile(filePath: string): boolean {
    const ext = getFileExtension(filePath);
    return BINARY_FILE_EXTENSIONS.has(ext);
}

function isExcludedFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return EXCLUDED_FILES.has(fileName);
}

async function isCodingFile(file: vscode.Uri): Promise<boolean> {
    const ext = getFileExtension(file.fsPath);
    if (USER_EXCLUDE_EXTENSIONS.has(ext) || BINARY_FILE_EXTENSIONS.has(ext) || isExcludedFile(file.fsPath)) {
        return false;
    }
    if (USER_INCLUDE_EXTENSIONS.has(ext)) {
        return true;
    }
    if (!isFileSizeAllowed(file.fsPath)) {
        return false;
    }
    try {
        const doc = await vscode.workspace.openTextDocument(file);
        return CODING_LANGUAGES.has(doc.languageId.toLowerCase());
    } catch (error) {
        console.error(`Error opening file ${file.fsPath}:`, error);
        return false;
    }
}

class TreeNode {
    children: Map<string, TreeNode> = new Map();
    constructor(public name: string) {}
}

function generateFileTree(files: string[]): string {
    const root = new TreeNode('');
    for (const file of files) {
        const parts = file.split(/[\/\\]/);
        let currentNode = root;
        for (const part of parts) {
            if (!currentNode.children.has(part)) {
                currentNode.children.set(part, new TreeNode(part));
            }
            currentNode = currentNode.children.get(part)!;
        }
    }

    function renderTree(node: TreeNode, prefix: string = '', isLast = true): string {
        let result = '';
        const childrenArray = Array.from(node.children.values());
        childrenArray.sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < childrenArray.length; i++) {
            const child = childrenArray[i];
            const isLastChild = i === childrenArray.length - 1;
            result += `${prefix}${isLastChild ? '└── ' : '├── '}${child.name}\n`;
            result += renderTree(child, prefix + (isLastChild ? '    ' : '│   '), isLastChild);
        }
        return result;
    }

    return renderTree(root);
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.extractCode', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const ig = ignore();
        const vsignorePath = path.join(workspaceFolder.uri.fsPath, '.vscodeignore');
        const gitignorePath = path.join(workspaceFolder.uri.fsPath, '.gitignore');

        if (fs.existsSync(vsignorePath)) {
            ig.add(fs.readFileSync(vsignorePath).toString());
        }
        if (fs.existsSync(gitignorePath)) {
            ig.add(fs.readFileSync(gitignorePath).toString());
        }

        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        let markdown = '';
        let extractedFiles: string[] = [];

        const progressOptions = {
            location: vscode.ProgressLocation.Notification,
            title: "Extracting Code",
            cancellable: true
        };

        await vscode.window.withProgress(progressOptions, async (progress, token) => {
            const filePromises = files.map(async (file, index) => {
                if (token.isCancellationRequested) {
                    return;
                }

                const relativePath = path.relative(workspaceFolder.uri.fsPath, file.fsPath);
                if (ig.ignores(relativePath) || isBinaryFile(file.fsPath) || isExcludedFile(file.fsPath)) {
                    return;
                }

                progress.report({ 
                    increment: 100 / files.length, 
                    message: `Processing ${relativePath} (${index + 1}/${files.length})` 
                });

                try {
                    if (await isCodingFile(file)) {
                        const doc = await vscode.workspace.openTextDocument(file);
                        const fileContent = doc.getText();
                        markdown += `\n\n## ${relativePath}\n\n\`\`\`${doc.languageId}\n${fileContent}\n\`\`\``;
                        extractedFiles.push(relativePath);
                    }
                } catch (error) {
                    console.error(`Error processing file ${file.fsPath}:`, error);
                }
            });

            await Promise.all(filePromises);

            if (extractedFiles.length > 0) {
                const fileTree = generateFileTree(extractedFiles);
                const fullMarkdown = `# Extracted Code Overview\n\n## File Tree\n\`\`\`\n${fileTree}\`\`\`\n${markdown}`;
                
                const markdownFile = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, outputFile));
                await vscode.workspace.fs.writeFile(markdownFile, Buffer.from(fullMarkdown));
                vscode.window.showInformationMessage(`Code extraction complete. Extracted ${extractedFiles.length} files to ${outputFile}`);
            } else {
                vscode.window.showInformationMessage('No files were processed. Check your ignore settings and file types.');
            }
        });
    });

    context.subscriptions.push(disposable);
}

function isFileSizeAllowed(filePath: string): boolean {
    const stats = fs.statSync(filePath);
    const fileSizeInKB = stats.size / 1024;
    return fileSizeInKB <= maxFileSizeKB;
}

export function deactivate() {}

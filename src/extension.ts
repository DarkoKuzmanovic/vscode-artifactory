import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

const config = vscode.workspace.getConfiguration('vscode-artifactory');
const outputFile = config.get('outputFile', 'extracted_code.md');

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

function isBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return BINARY_FILE_EXTENSIONS.has(ext);
}

function isExcludedFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return EXCLUDED_FILES.has(fileName);
}

async function isCodingFile(file: vscode.Uri): Promise<boolean> {
    if (isBinaryFile(file.fsPath) || isExcludedFile(file.fsPath)) {
        return false;
    }
    try {
        const doc = await vscode.workspace.openTextDocument(file);
        const languageId = doc.languageId.toLowerCase();
        return CODING_LANGUAGES.has(languageId);
    } catch (error) {
        console.error(`Error opening file ${file.fsPath}:`, error);
        return false;
    }
}

function generateFileTree(files: string[]): string {
    const tree: { [key: string]: any } = {};
    
    for (const file of files) {
        const parts = file.split(/[\/\\]/);  // Split on both forward and backward slashes
        let currentLevel = tree;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                currentLevel[part] = null;
            } else {
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part];
            }
        }
    }
    
    function renderTree(node: { [key: string]: any }, prefix: string = '', isLast = true): string {
        let result = '';
        const keys = Object.keys(node);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const isLastItem = i === keys.length - 1;
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            
            result += `${prefix}${isLastItem ? '└── ' : '├── '}${key}\n`;
            
            if (node[key] !== null) {
                result += renderTree(node[key], newPrefix, isLastItem);
            }
        }
        return result;
    }
    
    return renderTree(tree, '', true);
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
            let processedFiles = 0;
            for (const file of files) {
                if (token.isCancellationRequested) {
                    vscode.window.showInformationMessage(`Code extraction cancelled. Processed ${processedFiles} files, extracted ${extractedFiles.length}.`);
                    return;
                }

                const relativePath = path.relative(workspaceFolder.uri.fsPath, file.fsPath);
                if (ig.ignores(relativePath) || isBinaryFile(file.fsPath) || isExcludedFile(file.fsPath)) {
                    processedFiles++;
                    continue;
                }

                progress.report({ 
                    increment: 100 / files.length, 
                    message: `Processing ${relativePath} (${processedFiles + 1}/${files.length})` 
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

                processedFiles++;
            }

            if (processedFiles > 0) {
                const fileTree = generateFileTree(extractedFiles);
                const fullMarkdown = `# Extracted Code Overview\n\n## File Tree\n\`\`\`\n${fileTree}\`\`\n${markdown}`;
                
                const markdownFile = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, outputFile));
                await vscode.workspace.fs.writeFile(markdownFile, Buffer.from(fullMarkdown));
                vscode.window.showInformationMessage(`Code extraction complete. Processed ${processedFiles} files, extracted ${extractedFiles.length} to extracted_code.md`);
            } else {
                vscode.window.showInformationMessage('No files were processed. Check your ignore settings and file types.');
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
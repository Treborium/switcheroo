import * as vscode from 'vscode';
import { ExtensionContext, GlobPattern, TextEditor, Uri } from 'vscode';

const testFileExtension = '.spec.ts';
const sourceFileExtension = '.ts';
const sourceFileFolder = 'src';
const testFileFolder = 'src/test';

export function activate(context: ExtensionContext) {
	const disposable = vscode.commands.registerCommand('switcheroo.toggleBetweenTestAndSourceFile', toggleBetweenTestAndSourceFile);
	context.subscriptions.push(disposable);
}

export function deactivate() {}

async function toggleBetweenTestAndSourceFile() {
	const activeFile = vscode.window.activeTextEditor?.document.uri;
	if (!activeFile) {
		vscode.window.showErrorMessage('No source file opened. Please open a file in order to use the command.');
		return;
	}

	if (isTestFile(activeFile)) {
		switchToSourceFileFrom(activeFile);
	} else {
		switchToTestFileFrom(activeFile);
	}
}

async function switchToTestFileFrom(sourceFile: Uri) {
	const matchingTestFile = await findFileWithExtension(extractFileNameWithoutExtension(sourceFile), `**/${testFileFolder}/*${testFileExtension}`);
	if (!matchingTestFile) {
		vscode.window.showErrorMessage(`Could not find any matching test file. Please make sure a test file for ${extractFileName(sourceFile)} exists.`);
		return;
	}

	await openTextDocument(matchingTestFile);
}

async function switchToSourceFileFrom(testFile: Uri) {
	const matchingSourceFile = await findFileWithExtension(extractFileNameWithoutExtension(testFile), `**/${sourceFileFolder}/*${sourceFileExtension}`);
	if (!matchingSourceFile) {
		vscode.window.showErrorMessage(`Could not find any matching source file. Please make sure a source file for ${extractFileName(testFile)} exists.`);
		return;
	}
	await openTextDocument(matchingSourceFile);
}

async function findFileWithExtension(fileName: string, fileGlobPattern: GlobPattern): Promise<Uri | undefined> {
	const files = await vscode.workspace.findFiles(fileGlobPattern, `**/node_modules/**`);
	return files.find(file => extractFileNameWithoutExtension(file) === fileName);
}
 
async function openTextDocument(file: Uri): Promise<TextEditor> {
	console.log('Switching to', file);
	const document = await vscode.workspace.openTextDocument(file);
	return vscode.window.showTextDocument(document);
}

function isTestFile(file: Uri): boolean {
	return file.toString().endsWith(testFileExtension);
}

function extractFileNameWithoutExtension(path: Uri): string {
	const fileNameWithExtension = path.toString().split('/').pop() || path.toString();
	return fileNameWithExtension.split('.')[0];
}

function extractFileName(path: Uri): string {
	return path.toString().split('/').pop() || path.toString();
}
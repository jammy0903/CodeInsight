
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileManager } from './file-manager';
import { JavaCompiler } from './compiler';

describe('JavaCompiler', () => {
  let fileManager: FileManager;
  let javaCompiler: JavaCompiler;
  let projectPath: string | null = null;

  beforeEach(() => {
    fileManager = new FileManager();
    javaCompiler = new JavaCompiler();
  });

  afterEach(async () => {
    if (projectPath) {
      await fileManager.cleanup(projectPath);
      projectPath = null;
    }
  });

  it('should compile a valid Java file successfully', async () => {
    // Arrange
    const validCode = 'public class Main { public static void main(String[] args) { System.out.println("Hello"); } }';
    projectPath = await fileManager.createProject(validCode);

    // Act
    await javaCompiler.compile(projectPath);

    // Assert
    const classFilePath = path.join(projectPath, 'Main.class');
    const stats = await fs.stat(classFilePath);
    expect(stats.isFile()).toBe(true);
  }, 10000); // Increase timeout for compilation

  it('should throw a Compilation Error for an invalid Java file', async () => {
    // Arrange
    const invalidCode = 'public class Main { public static void main(String[] args) { System.out.println("Hello") } }'; // Missing semicolon
    projectPath = await fileManager.createProject(invalidCode);

    // Act & Assert
    await expect(javaCompiler.compile(projectPath)).rejects.toThrowError(/Compilation Error/);
  }, 10000); // Increase timeout for compilation
});

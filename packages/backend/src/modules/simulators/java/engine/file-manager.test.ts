
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileManager } from './file-manager';

describe('FileManager', () => {
  let fileManager: FileManager;
  let projectPath: string | null = null;
  const sampleCode = 'public class Main { public static void main(String[] args) {} }';

  beforeEach(() => {
    fileManager = new FileManager();
  });

  afterEach(async () => {
    if (projectPath) {
      await fileManager.cleanup(projectPath);
      projectPath = null;
    }
  });

  it('should create a new project directory with a Main.java file', async () => {
    // Act
    projectPath = await fileManager.createProject(sampleCode);

    // Assert
    expect(projectPath).toBeDefined();
    const mainJavaPath = path.join(projectPath, 'Main.java');
    
    // Check if Main.java exists
    const stats = await fs.stat(mainJavaPath);
    expect(stats.isFile()).toBe(true);

    // Check if the content is correct
    const content = await fs.readFile(mainJavaPath, 'utf-8');
    expect(content).toBe(sampleCode);
  });

  it('should clean up the project directory', async () => {
    // Arrange
    projectPath = await fileManager.createProject(sampleCode);
    
    // Act
    await fileManager.cleanup(projectPath);

    // Assert
    try {
      await fs.access(projectPath);
      // If access doesn't throw, the test fails
      expect.fail('Project directory should not be accessible after cleanup');
    } catch (error: any) {
      expect(error.code).toBe('ENOENT'); // ENOENT means "Error NO ENTry" or "file not found"
    }
    
    // Make sure we don't try to clean up again in afterEach
    projectPath = null; 
  });
});

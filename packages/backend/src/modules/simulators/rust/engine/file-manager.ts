/**
 * RustFileManager - Rust 프로젝트 임시 디렉토리 관리
 *
 * 역할:
 * - 임시 디렉토리 생성 (/tmp/rust-sim-XXXXXX)
 * - main.rs 파일 생성
 * - Cargo.toml 파일 생성
 * - 프로젝트 정리 (삭제)
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class RustFileManager {
  /**
   * 임시 Rust 프로젝트 생성
   *
   * @param sourceCode 실행할 Rust 소스 코드
   * @returns 프로젝트 디렉토리 경로
   */
  async createProject(sourceCode: string): Promise<string> {
    // 1. 임시 디렉토리 생성
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rust-sim-'));

    // 2. src 디렉토리 생성
    const srcDir = path.join(tmpDir, 'src');
    await fs.mkdir(srcDir);

    // 3. main.rs 생성
    const mainPath = path.join(srcDir, 'main.rs');
    await fs.writeFile(mainPath, sourceCode, 'utf8');

    // 4. Cargo.toml 생성 (기본 설정)
    const cargoToml = `[package]
name = "lesson"
version = "0.1.0"
edition = "2021"

[dependencies]
`;
    const cargoPath = path.join(tmpDir, 'Cargo.toml');
    await fs.writeFile(cargoPath, cargoToml, 'utf8');

    return tmpDir;
  }

  /**
   * 임시 프로젝트 삭제
   *
   * @param projectPath 프로젝트 디렉토리 경로
   */
  async cleanup(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup Rust project:', error);
    }
  }
}

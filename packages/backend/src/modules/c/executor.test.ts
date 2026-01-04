/**
 * C 코드 보안 패턴 테스트
 *
 * 테스트 전략:
 * 1. 각 FORBIDDEN_PATTERN이 정확히 차단하는지 확인
 * 2. 정상 코드는 통과하는지 확인 (오탐 방지)
 */

import { describe, it, expect } from 'vitest';
import { checkCodeSecurity, FORBIDDEN_PATTERNS } from './executor';

describe('FORBIDDEN_PATTERNS', () => {
  describe('프로세스/시스템 호출 차단', () => {
    it.each([
      ['system("ls")', 'system('],
      ['system ("ls")', 'system with space'],
      ['execl("/bin/sh", "sh", NULL)', 'execl('],
      ['execv("/bin/sh", args)', 'execv('],
      ['execve("/bin/sh", args, env)', 'execve('],
      ['execlp("sh", "sh", NULL)', 'execlp('],
      ['fork()', 'fork('],
      ['popen("ls", "r")', 'popen('],
      ['clone(fn, stack, flags)', 'clone('],
      ['vfork()', 'vfork('],
    ])('차단: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(false);
    });
  });

  describe('권한 상승 차단', () => {
    it.each([
      ['setuid(0)', 'setuid('],
      ['setgid(0)', 'setgid('],
      ['seteuid(0)', 'seteuid('],
      ['setegid(0)', 'setegid('],
      ['setreuid(0, 0)', 'setreuid('],
      ['setregid(0, 0)', 'setregid('],
    ])('차단: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(false);
    });
  });

  describe('디버깅/추적 차단', () => {
    it('ptrace 차단', () => {
      const result = checkCodeSecurity('ptrace(PTRACE_ATTACH, pid)');
      expect(result.safe).toBe(false);
    });
  });

  describe('어셈블리 차단', () => {
    it.each([
      ['__asm__("mov eax, 1")', '__asm__'],
      ['__asm volatile("syscall")', '__asm volatile'],
      ['asm("int $0x80")', 'asm('],
    ])('차단: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(false);
    });
  });

  describe('동적 로딩 차단', () => {
    it.each([
      ['dlopen("libc.so", RTLD_NOW)', 'dlopen('],
      ['dlsym(handle, "system")', 'dlsym('],
    ])('차단: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(false);
    });
  });

  describe('메모리 실행 차단', () => {
    it.each([
      ['mprotect(addr, size, PROT_EXEC)', 'mprotect('],
      ['mmap(NULL, size, PROT_READ|PROT_EXEC, flags, fd, 0)', 'mmap with PROT_EXEC'],
    ])('차단: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(false);
    });
  });

  describe('위험한 헤더 차단', () => {
    it.each([
      ['#include <unistd.h>', 'unistd.h'],
      ['#include <sys/types.h>', 'sys/'],
      ['#include <sys/socket.h>', 'sys/socket.h'],
      ['#include <pthread.h>', 'pthread.h'],
      ['#include <signal.h>', 'signal.h'],
      ['#include <socket.h>', 'socket.h'],
      ['#include <netinet/in.h>', 'netinet/'],
      ['#include <arpa/inet.h>', 'arpa/'],
      ['#include <dlfcn.h>', 'dlfcn.h'],
      ['#  include  <  unistd.h  >', 'unistd.h with spaces'],
    ])('차단: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(false);
    });
  });

  describe('정상 코드 허용 (오탐 방지)', () => {
    it.each([
      ['int main() { return 0; }', '기본 main'],
      ['#include <stdio.h>', 'stdio.h'],
      ['#include <stdlib.h>', 'stdlib.h'],
      ['#include <string.h>', 'string.h'],
      ['#include <math.h>', 'math.h'],
      ['printf("Hello World\\n");', 'printf'],
      ['scanf("%d", &x);', 'scanf'],
      ['malloc(100)', 'malloc'],
      ['free(ptr)', 'free'],
      ['int system_count = 0;', '변수명에 system 포함'],
      // 주석 내 system() 언급은 차단됨 (보안상 과차단 허용)
      ['char *exec_name = "test";', '변수명에 exec 포함'],
      ['int forkCount = 0;', '변수명에 fork 포함 (카멜케이스)'],
    ])('허용: %s (%s)', (code, _desc) => {
      const result = checkCodeSecurity(code);
      expect(result.safe).toBe(true);
    });
  });
});

describe('패턴 커버리지', () => {
  it('FORBIDDEN_PATTERNS 개수 확인', () => {
    // 패턴 추가/삭제 시 이 테스트가 실패하면 위 테스트도 업데이트 필요
    expect(FORBIDDEN_PATTERNS.length).toBe(28);
  });
});

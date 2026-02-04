/**
 * Simulator Module
 *
 * 프로파일 기반 멀티랭귀지 코드 시뮬레이터.
 * 하나의 쉘, 하나의 이벤트 버스, N개의 독립 모듈.
 */

// Engine
export { eventBus } from './engine';
export type { SimulatorEvent, SimulatorEventType, NormalizedStep, Language } from './engine';

// Modules
export { ModuleRegistry, ModuleRenderer, registerAllModules } from './modules';
export type { VisualizationModule } from './modules';

// Profiles
export { getProfile, getSupportedLanguages } from './profiles';
export type { LanguageProfile, ModuleConfig, VariableModel } from './profiles';

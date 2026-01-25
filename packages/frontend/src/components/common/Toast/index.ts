/**
 * Toast Notification Module
 *
 * Usage:
 * import { notify, notifySimulator, notifyAI, notifyNetwork } from '@/components/common/Toast';
 */

export {
  notify,
  notifyAI,
  notifySimulator,
  notifyNetwork,
  notifyAdmin,
  handleSimulatorError,
  handleAPIError,
} from './notifications';

export type { NotificationType, NotifyOptions } from './notifications';

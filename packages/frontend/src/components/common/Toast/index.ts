/**
 * Toast Notification Module
 *
 * Usage:
 * import { notify, notifySimulator, notifyNetwork } from '@/components/common/Toast';
 */

export {
  notify,
  notifySimulator,
  notifyNetwork,
  notifyAdmin,
  handleSimulatorError,
  handleAPIError,
} from './notifications';

export type { NotificationType, NotifyOptions } from './notifications';

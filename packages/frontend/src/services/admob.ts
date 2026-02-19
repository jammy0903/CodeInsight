import { AdMob, BannerAdSize, BannerAdPosition, AdmobConsentStatus, RewardAdPluginEvents } from '@capacitor-community/admob';
import type { BannerAdOptions, RewardAdOptions, AdLoadInfo, AdMobRewardItem } from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';

// Ad Unit IDs
const AD_UNITS = {
  banner: 'ca-app-pub-3721093787850391/6180948588',
  rewarded: 'ca-app-pub-3721093787850391/4328810867',
  // Test IDs for development (uncomment for testing)
  // banner: 'ca-app-pub-3940256099942544/6300978111',
  // rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

let isInitialized = false;

/**
 * Initialize AdMob
 * Call this once when the app starts
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) return;

  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });

    // Check and request consent (GDPR)
    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }

    isInitialized = true;
    console.log('[AdMob] Initialized successfully');
  } catch (error) {
    console.error('[AdMob] Initialization failed:', error);
  }
}

/**
 * Show banner ad at the bottom of the screen
 */
export async function showBannerAd(): Promise<void> {
  if (!isInitialized) {
    await initializeAdMob();
  }

  const options: BannerAdOptions = {
    adId: AD_UNITS.banner,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: false,
  };

  try {
    await AdMob.showBanner(options);
    console.log('[AdMob] Banner ad shown');
  } catch (error) {
    console.error('[AdMob] Failed to show banner:', error);
  }
}

/**
 * Hide the banner ad
 */
export async function hideBannerAd(): Promise<void> {
  try {
    await AdMob.hideBanner();
    console.log('[AdMob] Banner ad hidden');
  } catch (error) {
    console.error('[AdMob] Failed to hide banner:', error);
  }
}

/**
 * Remove the banner ad completely
 */
export async function removeBannerAd(): Promise<void> {
  try {
    await AdMob.removeBanner();
    console.log('[AdMob] Banner ad removed');
  } catch (error) {
    console.error('[AdMob] Failed to remove banner:', error);
  }
}

/**
 * Show rewarded ad
 * Returns true if the user watched the full ad and earned the reward
 */
export async function showRewardedAd(): Promise<{ rewarded: boolean; reward?: AdMobRewardItem }> {
  if (!isInitialized) {
    await initializeAdMob();
  }

  return new Promise((resolve) => {
    void (async () => {
      const options: RewardAdOptions = {
        adId: AD_UNITS.rewarded,
        isTesting: false,
      };

      let rewardListener: PluginListenerHandle | null = null;
      let dismissListener: PluginListenerHandle | null = null;
      let errorListener: PluginListenerHandle | null = null;
      let isSettled = false;

      const cleanupListeners = async () => {
        const listeners = [rewardListener, dismissListener, errorListener].filter(
          (listener): listener is PluginListenerHandle => listener !== null
        );
        await Promise.allSettled(listeners.map((listener) => listener.remove()));
      };

      const finish = async (result: { rewarded: boolean; reward?: AdMobRewardItem }) => {
        if (isSettled) return;
        isSettled = true;
        await cleanupListeners();
        resolve(result);
      };

      try {
        rewardListener = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          (reward: AdMobRewardItem) => {
            console.log('[AdMob] User earned reward:', reward);
            void finish({ rewarded: true, reward });
          }
        );

        dismissListener = await AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => {
            console.log('[AdMob] Rewarded ad dismissed');
            // Rewarded 이벤트와 경합할 수 있어 짧게 지연 후 확정
            setTimeout(() => {
              void finish({ rewarded: false });
            }, 100);
          }
        );

        errorListener = await AdMob.addListener(
          RewardAdPluginEvents.FailedToLoad,
          (error: unknown) => {
            console.error('[AdMob] Failed to load rewarded ad:', error);
            void finish({ rewarded: false });
          }
        );

        // Prepare the rewarded ad
        await AdMob.prepareRewardVideoAd(options);
        console.log('[AdMob] Rewarded ad prepared');

        // Show the rewarded ad
        await AdMob.showRewardVideoAd();
        console.log('[AdMob] Rewarded ad shown');
      } catch (error) {
        console.error('[AdMob] Error showing rewarded ad:', error);
        void finish({ rewarded: false });
      }
    })();
  });
}

/**
 * Preload rewarded ad for faster display
 */
export async function preloadRewardedAd(): Promise<AdLoadInfo | null> {
  if (!isInitialized) {
    await initializeAdMob();
  }

  const options: RewardAdOptions = {
    adId: AD_UNITS.rewarded,
    isTesting: false,
  };

  try {
    const result = await AdMob.prepareRewardVideoAd(options);
    console.log('[AdMob] Rewarded ad preloaded');
    return result;
  } catch (error) {
    console.error('[AdMob] Failed to preload rewarded ad:', error);
    return null;
  }
}

export const AdMobService = {
  initialize: initializeAdMob,
  showBanner: showBannerAd,
  hideBanner: hideBannerAd,
  removeBanner: removeBannerAd,
  showRewarded: showRewardedAd,
  preloadRewarded: preloadRewardedAd,
};

export default AdMobService;

// src/composables/useAuthLockout.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useAuthLockout(maxAttempts = 3, lockoutSeconds = 60) {
  const failedAttempts = ref(0);
  const isLockedOut = ref(false);
  const countdown = ref(0);
  
  let timerInterval = null;
  const STORAGE_KEY = 'tasleem_auth_lockout_time';

  // Function to clear the lockout state
  const clearLockout = () => {
    isLockedOut.value = false;
    countdown.value = 0;
    failedAttempts.value = 0;
    localStorage.removeItem(STORAGE_KEY);
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  // Function to start the 60s countdown
  const startLockout = () => {
    isLockedOut.value = true;
    countdown.value = lockoutSeconds;
    
    // Save the exact end time to localStorage
    const lockoutEndTime = Date.now() + (lockoutSeconds * 1000);
    localStorage.setItem(STORAGE_KEY, lockoutEndTime.toString());

    // Start the countdown timer
    timerInterval = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearLockout();
      }
    }, 1000);
  };

  // Call this when an API call fails (e.g., 401 Unauthorized)
  const recordFailure = () => {
    failedAttempts.value++;
    if (failedAttempts.value >= maxAttempts) {
      startLockout();
    }
  };

  // Call this when an API call succeeds
  const recordSuccess = () => {
    clearLockout();
  };

  // Check on page load if the user is already locked out (prevents refresh bypass)
  onMounted(() => {
    const lockoutEndStr = localStorage.getItem(STORAGE_KEY);
    if (lockoutEndStr) {
      const lockoutEndTime = parseInt(lockoutEndStr, 10);
      const now = Date.now();
      
      if (now < lockoutEndTime) {
        isLockedOut.value = true;
        failedAttempts.value = maxAttempts;
        countdown.value = Math.ceil((lockoutEndTime - now) / 1000);
        
        timerInterval = setInterval(() => {
          countdown.value--;
          if (countdown.value <= 0) {
            clearLockout();
          }
        }, 1000);
      } else {
        // Lockout expired while page was closed
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  });

  // Clean up interval when component is destroyed
  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  return {
    failedAttempts,
    isLockedOut,
    countdown,
    recordFailure,
    recordSuccess
  };
}
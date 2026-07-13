// Premium fast-loading public CDN audio assets for interactive user feedback
export const SOUNDS = {
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',            // UI click feedback
  ADD_TO_CART: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',      // Crisp digital bubble pop
  QUANTITY_TICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',    // Subtle tick pop
  ORDER_SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav',    // Triumphant digital chime/fanfare
  NOTIFICATION: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav',    // Alert chime for new order offers
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-84.wav'            // Buzzer / error sound for expired offers
};

export const playSound = (soundUrl: string) => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => {
      // Catch standard browser block on autoplay before user interaction
      console.warn('Audio play deferred/blocked by browser policy:', e);
    });
  } catch (err) {
    console.error('Audio initialization error:', err);
  }
};

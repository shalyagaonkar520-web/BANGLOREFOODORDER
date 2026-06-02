// Premium fast-loading public CDN audio assets for interactive user feedback
export const SOUNDS = {
  ADD_TO_CART: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // Crisp digital bubble pop
  QUANTITY_TICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // Subtle tick pop
  ORDER_SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav' // Triumphant digital chime/fanfare
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

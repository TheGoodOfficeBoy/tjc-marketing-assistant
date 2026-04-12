/* ─── saveScore: save every score, keep highest ─────────────── */
export const saveScore = async (name, role, score) => {
  // ใช้ encodeURIComponent แบบ simple ให้ key stable
  const safeKey = encodeURIComponent(name)
    .replace(/[.#$\/\[\]%]/g, '_')
    .substring(0, 60);

  const playerRef = ref(rtdb, 'Leaderboard/leaderboard/' + safeKey);
  console.log('[TD] saveScore →', name, role, score, '| key:', safeKey);

  try {
    const snapshot = await get(playerRef);

    // ถ้ามี record เดิมและคะแนนเดิมสูงกว่า → ไม่ update
    if (snapshot.exists() && snapshot.val().score >= score) {
      console.log('[TD] Not a new high score, skip. existing:', snapshot.val().score, 'new:', score);
      return;
    }

    // Save (ทั้ง record ใหม่ และ high score ใหม่)
    await set(playerRef, {
      name,
      role: role || 'user',
      score,
      updatedAt: Date.now()
    });
    console.log('[TD] Score saved ✅', name, score);

  } catch (err) {
    console.error('[TD] saveScore error:', err.code, err.message);
  }
};

/* ─── subscribeLeaderboard: real-time top 5 ─────────────────── */
export const subscribeLeaderboard = (callback) => {
  const lbQuery = query(
    ref(rtdb, 'Leaderboard/leaderboard'),
    orderByChild('score'),
    limitToLast(5)
  );

  console.log('[TD] subscribeLeaderboard start');

  return onValue(lbQuery, (snapshot) => {
    console.log('[TD] onValue fired, exists:', snapshot.exists());

    const entries = [];
    snapshot.forEach((child) => {
      entries.push({ id: child.key, ...child.val() });
    });

    // reverse เพราะ orderByChild เรียง ascending → ต้องกลับเป็น descending
    entries.reverse();

    console.log('[TD] Leaderboard entries:', entries.length, entries);
    callback(entries);

  }, (err) => {
    console.error('[TD] subscribeLeaderboard error:', err.code, err.message);
    callback([]);
  });
};

export { auth, db, rtdb };

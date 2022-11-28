/**
 * Collection: users
 * Changes:
 *   {
 *     bookmarkIds: ['nft1', 'nft2', 'nft3'],
 *     ...
 *   }
 *   =>
 *   {
 *     bookmarks: [
 *       {nftId: 'nft1', addedAt: Date},
 *       {nftId: 'nft2', addedAt: Date},
 *       {nftId: 'nft3', addedAt: Date}
 *     ],
 *     ...
 *   }
 */

module.exports = {
  async up(db) {
    const usersColl = db.collection('users');
    const date = new Date();
    for await (const user of usersColl.find()) {
      const newBookmarks = (user.bookmarkIds || []).map((nftId) => ({ nftId, addedAt: date }));
      await usersColl.updateOne(
        { _id: user._id },
        {
          $set: { bookmarks: newBookmarks },
          $unset: { bookmarkIds: 1 },
        },
      );
    }
  },

  async down(db) {
    // Optional
    const usersColl = db.collection('users');
    for await (const user of usersColl.find()) {
      await usersColl.updateOne(
        { _id: user._id },
        {
          $set: { bookmarkIds: (user.bookmarks || []).map((b) => b.nftId) },
          $unset: { bookmarks: 1 },
        },
      );
    }
  },
};

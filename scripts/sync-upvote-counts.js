/**
 * Script to sync upvote counts with upvotedBy array length
 * This ensures the upvote counter matches the actual number of users who upvoted
 * Run with: node scripts/sync-upvote-counts.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function syncUpvoteCounts() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const issuesCollection = db.collection('issues');

    // Get all issues
    const allIssues = await issuesCollection.find({}).toArray();
    console.log(`📊 Found ${allIssues.length} total issues\n`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let addedUpvotedBy = 0;

    for (const issue of allIssues) {
      const upvotedBy = Array.isArray(issue.upvotedBy) ? issue.upvotedBy : null;
      const currentUpvotes = issue.upvotes || 0;
      
      if (!upvotedBy) {
        // Issue doesn't have upvotedBy array - initialize it
        await issuesCollection.updateOne(
          { _id: issue._id },
          { 
            $set: { 
              upvotedBy: [],
              upvotes: 0,
              updatedAt: new Date()
            } 
          }
        );
        addedUpvotedBy++;
        console.log(`➕ Added upvotedBy array to issue: ${issue._id}`);
        continue;
      }

      const actualCount = upvotedBy.length;
      
      if (currentUpvotes !== actualCount) {
        // Mismatch - fix it
        await issuesCollection.updateOne(
          { _id: issue._id },
          { 
            $set: { 
              upvotes: actualCount,
              updatedAt: new Date()
            } 
          }
        );
        fixed++;
        console.log(`🔧 Fixed issue ${issue._id}: ${currentUpvotes} → ${actualCount} upvotes`);
      } else {
        alreadyCorrect++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Results:');
    console.log('='.repeat(50));
    console.log(`✅ Already correct: ${alreadyCorrect}`);
    console.log(`🔧 Fixed mismatches: ${fixed}`);
    console.log(`➕ Added upvotedBy arrays: ${addedUpvotedBy}`);
    console.log(`📊 Total processed: ${allIssues.length}`);

    // Verify the sync
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Verification:');
    console.log('='.repeat(50));

    const stats = await issuesCollection.aggregate([
      {
        $project: {
          upvotes: 1,
          upvotedByCount: { $size: { $ifNull: ['$upvotedBy', []] } },
          match: { $eq: ['$upvotes', { $size: { $ifNull: ['$upvotedBy', []] } }] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          matching: { $sum: { $cond: ['$match', 1, 0] } },
          totalUpvotes: { $sum: '$upvotes' },
          totalUpvotedBy: { $sum: '$upvotedByCount' }
        }
      }
    ]).toArray();

    if (stats.length > 0) {
      const s = stats[0];
      console.log(`Total issues: ${s.total}`);
      console.log(`Issues with matching counts: ${s.matching} (${((s.matching / s.total) * 100).toFixed(1)}%)`);
      console.log(`Sum of all upvotes: ${s.totalUpvotes}`);
      console.log(`Sum of all upvotedBy lengths: ${s.totalUpvotedBy}`);
      
      if (s.matching === s.total) {
        console.log('\n✅ All issues have accurate upvote counts!');
      } else {
        console.log(`\n⚠️ ${s.total - s.matching} issues still have mismatches`);
      }
    }

    console.log('\n✅ Sync completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

syncUpvoteCounts().catch(console.error);

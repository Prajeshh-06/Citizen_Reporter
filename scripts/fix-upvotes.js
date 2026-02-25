/**
 * Script to fix upvote data in existing issues
 * This adds the upvotedBy array to issues that don't have it
 * Run with: node scripts/fix-upvotes.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function fixUpvotes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const issuesCollection = db.collection('issues');

    // Find all issues without upvotedBy field
    const issuesWithoutUpvotedBy = await issuesCollection.find({
      upvotedBy: { $exists: false }
    }).toArray();

    console.log(`📊 Found ${issuesWithoutUpvotedBy.length} issues without upvotedBy field`);

    if (issuesWithoutUpvotedBy.length === 0) {
      console.log('✅ All issues already have upvotedBy field');
      return;
    }

    // Update all issues to add upvotedBy array
    const result = await issuesCollection.updateMany(
      { upvotedBy: { $exists: false } },
      { 
        $set: { 
          upvotedBy: [],
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} issues`);

    // Also fix any issues where upvotes is null or undefined
    const fixedUpvotes = await issuesCollection.updateMany(
      { 
        $or: [
          { upvotes: { $exists: false } },
          { upvotes: null }
        ]
      },
      { 
        $set: { 
          upvotes: 0,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Fixed ${fixedUpvotes.modifiedCount} issues with missing/null upvotes`);

    // Verify the fix
    const stats = await issuesCollection.aggregate([
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          withUpvotedBy: {
            $sum: { $cond: [{ $isArray: '$upvotedBy' }, 1, 0] }
          },
          withUpvotes: {
            $sum: { $cond: [{ $gte: ['$upvotes', 0] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    if (stats.length > 0) {
      console.log('\n📊 Database Statistics:');
      console.log(`   Total Issues: ${stats[0].totalIssues}`);
      console.log(`   With upvotedBy: ${stats[0].withUpvotedBy}`);
      console.log(`   With upvotes: ${stats[0].withUpvotes}`);
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

fixUpvotes().catch(console.error);

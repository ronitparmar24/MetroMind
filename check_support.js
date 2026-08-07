print('feedbacks: ' + db.feedbacks.countDocuments());
print('lostfounds total: ' + db.lostfounds.countDocuments());
print('lostfounds open: ' + db.lostfounds.countDocuments({status: {$in: ['reported','found']}}));
printjson(db.lostfounds.find({},{status:1,itemType:1,_id:0}).limit(5).toArray());

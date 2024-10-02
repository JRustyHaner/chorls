import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

//Collections
export const Scores =  new Mongo.Collection('scores');

//publish the scores
if (Meteor.isServer) {
  Meteor.publish('scores', function() {
    return Scores.find({});
  });
}

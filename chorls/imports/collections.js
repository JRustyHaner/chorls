import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Roles } from 'meteor/alanning:roles'


//Collections
export const Scores =  new Mongo.Collection('scores');

//publish the scores
if (Meteor.isServer) {
  Meteor.publish('scores', function() {
    return Scores.find({});
  });
}

Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({ 'user._id': this.userId });
  } else {
    this.ready()
  }
})

//if the user is an admin, give all users information
Meteor.publish(null, async function() {
  if (Roles.userIsInRoleAsync(this.userId, 'admin')) {
    return Meteor.users.find({});
  }
});
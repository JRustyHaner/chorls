import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Roles } from 'meteor/alanning:roles'


//Collections
//Scores 
export const Scores =  new Mongo.Collection('scores');

//organizations have name, custom url, and a list of user ids, and an invite key
Organizations = new Mongo.Collection('organizations');

//publish the scores
if (Meteor.isServer) {
  //publish scores that belong to the users organization
  Meteor.publish('scores', function() {
    if (this.userId) {
      user = Meteor.users.findOne({ _id: this.userId });
      return Scores.find({ organization: user.organization });
    } else {
      this.ready()
    }
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
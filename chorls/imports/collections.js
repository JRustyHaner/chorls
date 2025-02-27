import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Roles } from 'meteor/alanning:roles'


//Collections
//Scores 
export const Scores =  new Mongo.Collection('scores');

//organizations have name, custom url, and a list of user ids, and an invite key
export const Organizations = new Mongo.Collection('organizations');

// Publish the scores that belong to the user's organization
if (Meteor.isServer) {
  Meteor.publish('scores', async function() {
    if (this.userId) {
      const user = await Meteor.users.findOneAsync(this.userId);
      console.log("Publishing scores for organization: " + user.organization);
      return Scores.find({ organizationId: user.organization });
    } else {
      this.ready();
    }
  });

  // Publish the user's organization
  Meteor.publish('organizations', async function() {
    if (this.userId) {
      const user = await Meteor.users.findOneAsync(this.userId);
      return Organizations.findOneAsync({ _id: user.organization });
    } else {
      this.ready();
    }
  });
}

//Publish the users roles
Meteor.publish(null, function() {
  if (this.userId) {
    return Meteor.roles.find({ 'users': this.userId });
  } else {
    this.ready();
  }
});
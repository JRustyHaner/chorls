import { Meteor } from 'meteor/meteor';
import { Scores } from '../imports/collections';
import { Accounts } from "meteor/accounts-base";
import { Roles } from 'meteor/alanning:roles';

Meteor.startup(async function () {
  let user;
  // code to run on server at startup
  //define roles
  console.log("Starting up");
});

//scores arel
  //_id: score._id,
    //  title: title,
      //composer: composer,
      //arranger: arranger,
      //voiceType: voiceType,
      //number_of_copies: number_of_copies,
      //number_of_originals: number_of_originals,
      //library_number: library_number,
      //section: section,
      //tags: tags,
      //notes: notes,

Meteor.methods({
  //method to log to server console
  'serverConsole': function(message){
    console.log("Client message: " + message);
  },
  // method to add scores
  'addScore': function(score) {
    console.log("Adding score: " + score.title, score.composer, score.lyricist, score.voiceType, score.number_of_copies, score.notes);
    // insert the score into the database
    Scores.insertAsync({
      title: score.title,
      composer: score.composer,
      arranger: score.arranger,
      voiceType: score.voiceType,
      number_of_copies: score.number_of_copies,
      number_of_originals: score.number_of_originals,
      library_number: score.library_number,
      section: score.section,
      tags: score.tags,
      notes: score.notes,

    });
    return "Score added";
  },
  'deleteScore': function(scoreId) {
    console.log("Deleting score: " + scoreId);
    Scores.removeAsync({_id: scoreId});
    return "Score deleted";
  },
  'updateScore': function(score) {
    console.log("Updating score: " + score._id);
    Scores.updateAsync({_id: score._id}, {
      title: score.title,
      composer: score.composer,
      arranger: score.arranger,
      voiceType: score.voiceType,
      number_of_copies: score.number_of_copies,
      number_of_originals: score.number_of_originals,
      library_number: score.library_number,
      section: score.section,
      tags: score.tags,
      notes: score.notes,

      
      
    });
    return "Score updated";
  },
  //user management, roles are admin and user. We use allanning:roles package
  'addUser': function(email, password, role) {
    console.log("Adding user: " + email);
    Accounts.createUser({
      email: email,
      password: password,
    });
    user = Meteor.users.findOneAsync({email: email});
    Roles.addUsersToRolesAsync(user._id, role);
    return "User added";
  },
  'deleteUser': function(userId) {
    console.log("Deleting user: " + userId);
    Meteor.users.removeAsync({_id: userId});
    return "User deleted";
  },
  'updateUser': function(userId, email, password) {
    console.log("Updating user: " + userId);
    Accounts.setUsername(userId, email);
    Accounts.addEmailAsync(userId, email);
    Accounts.setPasswordAsync(userId, password);
    //remove the flag for reset
    Meteor.users.updateAsync({_id: userId}, {$set: {flag_for_reset: false}});
    return "User updated";
  },
  'promoteUser': function(userId) {
    if(!userId)
      return "No user id provided";
    console.log("Promoting user: " + userId);
    Roles.addUsersToRolesAsync(userId, "admin");
    return "User promoted";
  },
  'demoteUser': function(userId) {
    if(!userId)
      return "No user id provided";
    console.log("Demoting user: " + userId);
    Roles.removeUsersFromRolesAsync(userId, "admin");
    return "User demoted";
  },
})
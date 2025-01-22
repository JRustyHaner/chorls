import { Meteor } from 'meteor/meteor';
import { Scores } from '../imports/collections';
import { Organizations } from '../imports/collections';
import { Accounts } from "meteor/accounts-base";
import { Roles } from 'meteor/alanning:roles';
import { Random } from 'meteor/random';

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
      //history: history: {action, date, user}

Meteor.methods({
  //method to log to server console
  'serverConsole': function(message){
    console.log("Client message: " + message);
  },
  //method to add an organization

  // method to add scores
  'addScore': function(score) {
    console.log("Adding score: " + score.title, score.composer, score.lyricist, score.voiceType, score.number_of_copies, score.notes);
    // insert the score into the database
    newHistory = {
      action: "Added",
      date: new Date(),
      user: Meteor.userId(),
    }
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
      history: [],

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
    //find the score schange and log those changes in the history
    newHistory = {
      action: "Updated",
      date: new Date(),
      user: Meteor.userId(),
    }
    score.history.push(newHistory);
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
      history: score.history,
    });
    return "Score updated";
  },
  'importScores': function(scores) {
    console.log("Importing scores");
    for (score in scores) {
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
        history: []
      });
    }
    return "Scores imported";
  },
  //user management, roles are admin and user. We use allanning:roles package
  'registerUser': async function(newuser) {
    console.log("registerUser: ", JSON.stringify(newuser, null, 2));
    try {
      const username = newuser.username;
      const password = newuser.password;
      const organization_key = newuser.organization_key;
      let org;
      let key;
      let user;
      const role = 'user';

      // Check if the user already exists
      const existingUser = Accounts.findUserByEmail(username);
      if (existingUser) {
        throw new Meteor.Error(403, 'User already exists');
      }

      // Get the correct organization from the key, if not blank
      if (organization_key != "") {
        org = await Organizations.findOneAsync({ key: organization_key });
        console.log("Adding user: " + username + " to organization: " + org.name);
      } else {
        // Create an organization for the user and generate a key
        key = Random.id();
        console.log("Creating organization for user: " + username + " with key: " + key);
        org = await Organizations.insertAsync({
          name: username,
          key: key,
          users: [username],
        });
      }

      const userId = Accounts.createUser({
        email: username,
        password: password,
        organization: org._id,
      });

      // Add user to roles
      await Roles.addUsersToRolesAsync(userId, role);
      return { status: "success", message: "User added" };
    } catch (error) {
      console.log("Error adding user: " + error);
      return { status: "error", message: error.message };
    }
  },
  'deleteUser': function(userId) {
    console.log("Deleting user: " + userId);
    Meteor.users.removeAsync({_id: userId});
    return "User deleted";
  },
  'removeUserFromOrganization': function(userId) {
    console.log("Removing user from organization: " + userId);
    Meteor.users.updateAsync({_id: userId}, {$unset: {organization: ""}});
    return "User removed from organization";
  },
  'addUserToOrganization': function(userId, organization_key) {
    //get the correct organization from the key
    org = Organizations.findOneAsync({key: organization_key});
    console.log("Adding user to organization: " + userId + " to organization: " + org.name);
    Meteor.users.updateAsync({_id: userId}, {$set: {organization: org._id}});
    return "User added to organization";
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
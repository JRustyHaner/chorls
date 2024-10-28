import { Meteor } from 'meteor/meteor';
import { Scores } from '../imports/collections';
import { Accounts } from "meteor/accounts-base";
import { Roles } from 'meteor/alanning:roles';

Meteor.startup(async function () {
  let user;
  // code to run on server at startup
  //define roles
  console.log("Starting up");
  await Roles.createRoleAsync("admin", {unlessExists: true});
  await Roles.createRoleAsync("user", {unlessExists: true});
  //print out the settings
  console.log("Settings: ");
  console.log(Meteor.settings);
  console.log("Admin email: " + Meteor.settings.admin.email);
  console.log("Admin username: " + Meteor.settings.admin.username);
  console.log("Admin password: " + Meteor.settings.admin.password);
  //add the admin user from settings.json, we are using Meteor 3, so we need to use async functions
  //we need to check if an admin user already exists, if not, create one based on the settings.json file
  let adminUsers = await Roles.getUsersInRoleAsync("admin");
  console.log("Admin users: " + adminUsers.length);
  try{
    if (adminUsers.length == undefined || adminUsers.length == 0) {
      console.log("No admin users found, creating one");
      let newuser;
      if (Meteor.settings.admin.username) {
        newuser = await Accounts.createUserAsync({
          email: Meteor.settings.admin.email,
          password: Meteor.settings.admin.password,
        });
      } else {
        newuser = await Accounts.createUserAsync({
          email: "admin@admin.com",
          password: "admin",
        });
      }
      //flag the user for a reset password
      await Meteor.users.updateAsync({_id: newuser}, {$set: {flag_for_reset: true}});
      console.log("New user: " + newuser);
      await Roles.addUsersToRolesAsync(newuser, ["admin"]);
      //print out new user's roles
      console.log("New user roles: ");
      console.log(await Roles.getRolesForUserAsync(newuser));
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    //the user might exist but not have the admin role, so we need to add it
    console.log("Error creating admin user: " + error);
    console.log("Checking if user is an admin");
    //we search for someone with emails[].address == Meteor.settings.admin.email
    let user = await Meteor.users.findOneAsync({"emails.address": Meteor.settings.admin.email});
    console.log("User: " + JSON.stringify(user));
    let roles = await Roles.getRolesForUserAsync(user._id);
    console.log("Roles: " + roles);
    if (roles.length == 0) {
      console.log("User is not an admin, adding admin role");
      await Roles.addUsersToRolesAsync(user, ["admin"]);
    }
  }
  user = Meteor.users.findOneAsync({"emails.address": "admin@admin.com"});
  await Roles.addUsersToRolesAsync([user._id], ["admin"]);
});

//scores are
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
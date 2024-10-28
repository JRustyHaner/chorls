import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/pwix:blaze-layout';
import { Accounts } from 'meteor/accounts-base';

//roles
import { Roles } from 'meteor/alanning:roles';

import './main.html';

Scores = new Mongo.Collection('scores');

//routing using flow-router
FlowRouter.route('/', {
  name: 'home',
  action() {
    //if admin, subscribe to all users
    if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
      Meteor.subscribe('allUsers');
    } 
    //if flagged for reset, render the reset template
    if(Meteor.user()){
      if (Meteor.user().flag_for_reset) {
        console.log("flagged for reset");
        BlazeLayout.render('main', {content: 'reset'});
      }
    }
    Meteor.subscribe('scores');
    Meteor.callAsync('serverConsole','connected');
    //if logged in, render the main template with the content set to home
    //if not logged in, render the main template with the content set to login
    BlazeLayout.render('main', {content: Meteor.userId() ? 'dashboard' : 'login', scores: Scores.find({}).fetch()});
  }
});



//reactive var for the search bar
Template.searchbar.onCreated(function() {
  this.searchOptions = new ReactiveVar([]);
  this.search = new ReactiveVar('');
});

//general template helpers
Template.searchbar.helpers({
  //search options
  searchOptions() {
    ret =  Template.instance().searchOptions.get();
    console.log("searchOptions: " + JSON.stringify(ret));
    return ret;
  },
  search() {
    return Template.instance().search.get();
  },
  isAdministrator: async function() {
    return await Roles.userIsInRoleAsync(Meteor.userId(), 'admin');
  }
});

//template for isUserLoggedIn
Template.registerHelper('isUserLoggedIn', function() {
  return Meteor.userId();
});

//logo image
Template.registerHelper('logo', function() {
  //return full url to /images/logo.png
  return document.location.origin + '/images/logo.png';
});

//general events
Template.searchbar.events({
  'click #logout'(event, instance) {
    event.preventDefault();
    console.log("logging out");
    //make a meteor async call to logout
    Meteor.logout(function(error) {
      if (error) {
        console.log(error);
      } else {
        console.log("logged out");
        BlazeLayout.render('main', {content: 'login'});
      }
    });
  },
  'click #admin'(event, instance) {
    event.preventDefault();
    //redirect to the userAdmin page
    BlazeLayout.render('main', {content: 'userAdmin'});
  },
  //add_score button click
  'click #add_score'(event, instance) {
    //redirect to the add_score page
    BlazeLayout.render('main', {content: 'add_score'});
  },
  //search bar change
  'keyup #search'(event, instance) {
    //get the search bar value
    var search = document.getElementById('search').value;
    //set the search reactive var
    instance.search.set(search);
    console.log(search);
    //search any score that has the search value in any of the fields and report on which fields the search value was found. If multiple fields have the search value, the score is returned once, listing all the fields that have the search value
    //search is case insensitive
    //search is a substring search
    //get all the scores
    var scores = Scores.find({}).fetch();
    //search the scores for the search value
    var searchScores = [];
    for (var i = 0; i < scores.length; i++) {
      //get the score
      var score = scores[i];
      //get the score fields
      var fields = Object.keys(score);
      //search the fields for the search value
      for (var j = 0; j < fields.length; j++) {
        //get the field
        var field = fields[j];
        //get the value of the field
        var value = score[field];
        //if the value is a string and the search value is a substring of the value
        if (typeof value === 'string' && value.toLowerCase().includes(search.toLowerCase())) {
          //add the score to the searchScores array with the field that has the search value
          score.field = field;
          score.id = score._id;
          searchScores.push(score);
          break;
        }
      }
    }

    console.log(searchScores);
    instance.searchOptions.set(searchScores);
  },
  'click #view_score': function(event, instance) {
    event.preventDefault();
    
    //get the id from the link's data-score attribute
    var id = $(event.currentTarget).attr('data-score');
    score = Scores.findOne({_id: id});
    console.log(id, score);
    //redirect to the view_score page with the search value
    BlazeLayout.render('main', {content: 'view_score', score: score});
    //clear the search bar
    instance.search.set('');
    document.getElementById('search').value = '';
  },
  //home button click
  'click #home'(event, instance) {
    event.preventDefault();
    //redirect to the home page
    BlazeLayout.render('main');
  }
});
//main subscription
Template.searchbar.onCreated(function() {
  //subscribe to the scores publication
  Meteor.subscribe('scores');
});



//view score helpers
Template.view_score.helpers({
  edit() {
    return Template.instance().edit.get();
  }
});

//view score events
Template.view_score.events({
  //edit button click, enables all the input field (they are readonly by default)
  'click #edit_score'(event, instance) {
    event.preventDefault();
    //get all input fields
    var inputs = document.getElementsByTagName('input');
    //enable all input fields
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].readOnly = false;
    }
    //enable the notes textarea
    document.getElementById('view_notes').readOnly = false;
    //enable the save and delete buttons
    document.getElementById('save_score').disabled = false;
    document.getElementById('delete_score').disabled = false;
  },
  //save button click, saves the changes to the score save_score
  'click #save_score'(event, instance) {
    //fields are the same as the input fields in add_score, except input is replaced with view
    event.preventDefault();
    console.log("saving score");
    //get the selected score
    //the score id comes from a span with the id of view_id
    var scoreID = document.getElementById('view_id').innerHTML;
    //get all the input fields
    var title = document.getElementById('view_title').value;
    var composer = document.getElementById('view_composer').value;
    var arranger = document.getElementById('view_arranger').value;
    var voiceType = document.getElementById('view_voice_type').value;
    var number_of_copies = document.getElementById('view_number_of_copies').value;
    var number_of_originals = document.getElementById('view_number_of_originals').value;
    var library_number = document.getElementById('view_library_number').value;
    var section = document.getElementById('view_section').value;
    var tags = document.getElementById('view_tags').value;
    var notes = document.getElementById('view_notes').value;
    //make a meteor async call to update the score
    score =
    {
      _id: scoreID,
      title: title,
      composer: composer,
      arranger: arranger,
      voiceType: voiceType,
      number_of_copies: number_of_copies,
      number_of_originals: number_of_originals,
      library_number: library_number,
      section: section,
      tags: tags,
      notes: notes,
    }
    Meteor.call('updateScore', {
      _id: score._id,
      title: title,
      composer: composer,
      arranger: arranger,
      voiceType: voiceType,
      number_of_copies: number_of_copies,
      number_of_originals: number_of_originals,
      library_number: library_number,
      section: section,
      tags: tags,
      notes: notes,
    }, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    //disable all input fields except #search
    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].id != 'search') {
        inputs[i].readOnly = true;
      }
    }
    //disable the notes textarea
    document.getElementById('view_notes').readOnly = true;
    alert('Score Saved');
  },
  //delete button click, deletes the score
  'click #delete_score'(event, instance) {
    var scoreID = document.getElementById('view_id').innerHTML;
    //get the selected score
    var score = instance.selectedScore.get();
    //make a meteor async call to delete the score
    Meteor.call('deleteScore', scoreID , function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    alert('Score Deleted');
    //redirect to the home page
    BlazeLayout.render('main', {content: 'dashboard'});
  },
  //voice type buttons (view_soprano, view_alto, view_tenor, view_bass) adds the voice type to the view_voice_type
  'click #view_soprano'(event, instance) {
    event.preventDefault();
    //get the view_voice_type value and add S for soprano in the correct order
    var voice_type = document.getElementById('view_voice_type').value;
    voice_type = 'S' + voice_type;
    document.getElementById('view_voice_type').value = voice_type;
  },
  'click #view_alto'(event, instance) {
    event.preventDefault();
    //get the view_voice_type value and add A for alto in the correct order
    var voice_type = document.getElementById('view_voice_type').value;
    //find the last capital S and add A after it. If there is no S, add A at the beginning
    var index = voice_type.lastIndexOf('S');
    if (index == -1) {
      voice_type = 'A' + voice_type;
    } else {
      voice_type = voice_type.substring(0, index + 1) + 'A' + voice_type.substring(index + 1);
    }
    document.getElementById('view_voice_type').value = voice_type;
  },
  'click #view_tenor'(event, instance) {
    event.preventDefault();
    //get the view_voice_type value and add T for tenor in the correct order
    var voice_type = document.getElementById('view_voice_type').value;
    //find the last capital A and add T after it. If there is no A, add T after the last S, if there is no S, add T at the beginning
    var index = voice_type.lastIndexOf('A');
    if (index == -1) {
      index = voice_type.lastIndexOf('S');
      if (index == -1) {
        voice_type = 'T' + voice_type;
      } else {
        voice_type = voice_type.substring(0, index + 1) + 'T' + voice_type.substring(index + 1);
      }
    } else {
      voice_type = voice_type.substring(0, index + 1) + 'T' + voice_type.substring(index + 1);
    }
    document.getElementById('view_voice_type').value = voice_type;
  },
  'click #view_bass'(event, instance) {
    event.preventDefault();
    //get the view_voice_type value and add B for bass in the correct order
    var voice_type = document.getElementById('view_voice_type').value;
    //find the last capital T and add B after it. If there is no T, add B after the last A, if there is no A, add B after the last S, if there is no S, add B at the beginning
    var index = voice_type.lastIndexOf('T');
    if (index == -1) {
      index = voice_type.lastIndexOf('A');
      if (index == -1) {
        index = voice_type.lastIndexOf('S');
        if (index == -1) {
          voice_type = 'B' + voice_type;
        } else {
          voice_type = voice_type.substring(0, index + 1) + 'B' + voice_type.substring(index + 1);
        }
      } else {
        voice_type = voice_type.substring(0, index + 1) + 'B' + voice_type.substring(index + 1);
      }
    } else {
      voice_type = voice_type.substring(0, index + 1) + 'B' + voice_type.substring(index + 1);
    }
    document.getElementById('view_voice_type').value = voice_type;
  },
  //clear_voice_type button clears view_voice_type
  'click #clear_voice_type'(event, instance) {
    event.preventDefault();
    document.getElementById('view_voice_type').value = '';
  }

});



Template.add_score.onCreated(function() {
  //subscribe to the scores publication
  Meteor.subscribe('scores');
  //reactive var for the title from the search
  this.title = new ReactiveVar('');
});

//onload for add_score
Template.add_score.onRendered(function() {

});


//userAdmin Template helpers
Template.userAdmin.helpers({
  //all users
  users: async function() {
    //return email and role
  users =  Meteor.users.find({}).fetch();
  //add roles to the users
  users = users.map(async function(user) {
    //check if user is an admin
    user.isAdmin = await Roles.userIsInRoleAsync(user._id, 'admin');
  });
  return users;
},
});
//userAdmin Template events
Template.userAdmin.events({
  //add_user button click
  'click #add_user'(event, instance) {
    event.preventDefault();
    //get the email and role from the input fields
    var email = document.getElementById('email').value;
    var role = document.getElementById('role').value;
    //make a meteor async call to add a user
    Meteor.call('addUser', email, role, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    document.getElementById('email').value = '';
    document.getElementById('role').value = '';
    alert('User Added');
  },
  //delete_user button click
  'click #delete_user'(event, instance) {
    event.preventDefault();
    //get the email from the data-score attribute of the button
    var email = $(event.target).attr('data-score');
    //make a meteor async call to delete a user
    Meteor.call('deleteUser', email, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    alert('User Deleted');
  },
  //promote_user button click
  'click #promote_user'(event, instance) {
    event.preventDefault();
    //get the email from the data-score attribute of the button
    var email = $(event.target).attr('data-score');
    
    //make a meteor async call to promote a user
    Meteor.call('promoteUser', email, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    document.getElementById('email').value = '';
    alert('User Promoted');
  },
  //demote_user button click
  'click #demote_user'(event, instance) {
    event.preventDefault();
    //get the email from the data-score attribute of the button
    var email = $(event.target).attr('data-score');
    //make a meteor async call to demote a user
    Meteor.call('demoteUser', email, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    document.getElementById('email').value = '';
    alert('User Demoted');
  }
});

//flag_for_reset Template events, template name reset
Template.reset.events({
  //reset button click
  'click #reset': async function(event, instance) {
    event.preventDefault();
    //get the email from the input field
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    //make a meteor async call to reset a user
    await Meteor.callAsync('updateUser', Meteor.userId(), email, password);
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    //redirect to the home page
    //logout
    Meteor.logout();
    BlazeLayout.render('main', {content: 'login'});
  }
});



Template.add_score.events({
  //input_title, input_composer, input_lyricist, input_fuchs, input_number_of_copies, input_notes
  'click #submit_new_score'(event, instance) {
    //prevent the default event
    event.preventDefault();
    console.log("submitting new score");
    //make a meteor async call to add a score. An object with the following fields should be passed to the method:
    //title, composer, lyricist, fuchs, number_of_copies, notes. we get that from the input fields
    //the fuchs scale are from input_soprano, input_alto, input_tenor, input_bass. if soprano
    console.log(document.getElementById('input_title').value, document.getElementById('input_composer').value, document.getElementById('input_arranger').value, document.getElementById('input_voice_type'), document.getElementById('input_number_of_copies').value, document.getElementById('input_notes').value);
    Meteor.call('addScore', {
      title: document.getElementById('input_title').value,
      composer: document.getElementById('input_composer').value,
      arranger: document.getElementById('input_arranger').value,
      voiceType: document.getElementById('input_voice_type').value,
      number_of_copies: document.getElementById('input_number_of_copies').value,
      number_of_originals: document.getElementById('input_number_of_originals').value,
      library_number: document.getElementById('library_number').value,
      section: document.getElementById('section').value,
      tags: document.getElementById('tags').value,
      notes: document.getElementById('input_notes').value,
    }, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    document.getElementById('input_title').value = '';
    document.getElementById('input_arranger').value='';
    document.getElementById('input_number_of_copies').value='';
    document.getElementById('library_number').value='';
    document.getElementById('section').value='';
    document.getElementById('tags').value='',
    document.getElementById('input_notes').value='',
    document.getElementById('input_voice_type').value = '';
    alert('Score Added');
  },
  //SATB buttons (add_soprano, add_alto, add_tenor, add_bass, add_treble adds the voice type to the input_voice_type). It must be in order of SATB
  'click #add_soprano'(event, instance) {
    event.preventDefault();
    //get the input_voice_type value and add S for soprano in the correct order
    var voice_type = document.getElementById('input_voice_type').value;
    voice_type = 'S' + voice_type;
    document.getElementById('input_voice_type').value = voice_type;
  },
  'click #add_alto'(event, instance) {
    event.preventDefault();
    //get the input_voice_type value and add A for alto in the correct order
    var voice_type = document.getElementById('input_voice_type').value;
    //find the last capital S and add A after it. If there is no S, add A at the beginning
    var index = voice_type.lastIndexOf('S');
    if (index == -1) {
      voice_type = 'A' + voice_type;
    } else {
      voice_type = voice_type.substring(0, index + 1) + 'A' + voice_type.substring(index + 1);
    }
    document.getElementById('input_voice_type').value = voice_type;
  },
  'click #add_tenor'(event, instance) {
    event.preventDefault();
    //get the input_voice_type value and add T for tenor in the correct order
    var voice_type = document.getElementById('input_voice_type').value;
    //find the last capital A and add T after it. If there is no A, add T after the last S, if there is no S, add T at the beginning
    var index = voice_type.lastIndexOf('A');
    if (index == -1) {
      index = voice_type.lastIndexOf('S');
      if (index == -1) {
        voice_type = 'T' + voice_type;
      } else {
        voice_type = voice_type.substring(0, index + 1) + 'T' + voice_type.substring(index + 1);
      }
    } else {
      voice_type = voice_type.substring(0, index + 1) + 'T' + voice_type.substring(index + 1);
    }
    document.getElementById('input_voice_type').value = voice_type;
  },
  'click #add_bass'(event, instance) {
    event.preventDefault();
    //get the input_voice_type value and add B for bass in the correct order
    var voice_type = document.getElementById('input_voice_type').value;
    //find the last capital T and add B after it. If there is no T, add B after the last A, if there is no A, add B after the last S, if there is no S, add B at the beginning
    var index = voice_type.lastIndexOf('T');
    if (index == -1) {
      index = voice_type.lastIndexOf('A');
      if (index == -1) {
        index = voice_type.lastIndexOf('S');
        if (index == -1) {
          voice_type = 'B' + voice_type;
        } else {
          voice_type = voice_type.substring(0, index + 1) + 'B' + voice_type.substring(index + 1);
        }
      } else {
        voice_type = voice_type.substring(0, index + 1) + 'B' + voice_type.substring(index + 1);
      }
    } else {
      voice_type = voice_type.substring(0, index + 1) + 'B' + voice_type.substring(index + 1);
    }
    document.getElementById('input_voice_type').value = voice_type;
  },
  //clear_voice_type button clears input_voice_type
  'click #clear_voice_type'(event, instance) {
    event.preventDefault();
    document.getElementById('input_voice_type').value = '';
  }
});

Template.login.events({
  'click #login'(event, instance) {
    event.preventDefault();
    console.log("logging in");
    //get the username and password from the input fields
    var username = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    //make a meteor async call to login
    Meteor.loginWithPassword(username, password, async function(error) {
      if (error) {
        console.log(error);
        alert('Invalid Username or Password, please try again');
      } else {
        //if profile.flagged_for_reset is true, redirect to the reset page if the user is an admin, otherwise redirect to the home page
        user = Meteor.user();
        Meteor.callAsync('serverConsole', 'logged in as ' + user + 'with roles ' + await Roles.getRolesForUserAsync(user._id));
        if (user.flag_for_reset) {
          Meteor.callAsync('serverConsole', 'redirecting to reset');
          BlazeLayout.render('main', {content: 'reset'});
        } else {
          Meteor.callAsync('serverConsole', 'redirecting to dashboard');
          BlazeLayout.render('main', {content: 'dashboard', scores: Scores.find({}).fetch()});
        }
        console.log("logged in");
      }
    });
  },
  'click #register'(event, instance) {
    event.preventDefault();
    console.log("registering");
    //get the username and password from the input fields
    var username = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    //make a meteor async call to register.
    Accounts.createUser({
      username: username,
      password: password,
    }, function(error) {
      if (error) {
        console.log(error);
        BlazeLayout.render('main', {content: 'login'});
      } else {
        console.log("registered");
        BlazeLayout.render('main', {content: 'dashboard', scores: Scores.find({}).fetch()});
      }
    });
  },
});

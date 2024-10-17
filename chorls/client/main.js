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
    Meteor.callAsync('serverConsole','connected');
    //if logged in, render the main template with the content set to home
    //if not logged in, render the main template with the content set to login
    BlazeLayout.render('main', {content: Meteor.userId() ? 'dashboard' : 'login', scores: Scores.find({}).fetch()});
  }
});



//reactive var for the search bar
Template.main.onCreated(function() {
  this.searchOptions = new ReactiveVar([]);
  this.search = new ReactiveVar('');
});

//general template helpers
Template.main.helpers({
  //search options
  searchOptions() {
    return Template.instance().searchOptions.get();
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
  return document.location.origin + '/images/logo.jpeg';
});


//template helper for dashboard
Template.dashboard.helpers({
  //scores
  scores() {
    console.log(Scores.find({}).fetch());
    return Scores.find({}).fetch();
  }
});
//general events
Template.main.events({
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
    //search any score that has the search value in any of the fields
    //we want to return the title and the field that the search value was found in
    scoreByTitle = Scores.find({title: {$regex: search, $options: 'i'}}).fetch();
    scoreByComposer = Scores.find({composer: {$regex: search, $options: 'i'}}).fetch();
    scoreByArranger = Scores.find({arranger: {$regex: search, $options: 'i'}}).fetch();
    scoreByvoiceType = Scores.find({voiceType: {$regex: search, $options: 'i'}}).fetch();
    scoreByNotes = Scores.find({notes: {$regex: search, $options: 'i'}}).fetch();
    scoreByTags = Scores.find({tags: {$regex: search, $options: 'i'}}).fetch();
    //combine all the search results in an object {title: title, field: field, _id: _id}
    searchScores = [];
    searchScores = searchScores.concat(scoreByTitle.map(function(score) {
      return {title: score.title, field: "title", _id: score._id, composer: score.composer, arranger: score.arranger, voiceType: score.voiceType, notes: score.notes, tags: score.tags};
    }));
    searchScores = searchScores.concat(scoreByComposer.map(function(score) {
      return {title: score.title, field: "composer", _id: score._id, composer: score.composer, arranger: score.arranger, voiceType: score.voiceType, notes: score.notes, tags: score.tags};
    }));
    searchScores = searchScores.concat(scoreByArranger.map(function(score) {
      return {title: score.title, field: "arranger", _id: score._id, composer: score.composer, arranger: score.arranger, voiceType: score.voiceType, notes: score.notes, tags: score.tags};
    }));
    searchScores = searchScores.concat(scoreByvoiceType.map(function(score) {
      return {title: score.title, field: "voiceType", _id: score._id, composer: score.composer, arranger: score.arranger, voiceType: score.voiceType, notes: score.notes, tags: score.tags};
    }));
    searchScores = searchScores.concat(scoreByNotes.map(function(score) {
      return {title: score.title, field: "notes", _id: score._id, composer: score.composer, arranger: score.arranger, voiceType: score.voiceType, notes: score.notes, tags: score.tags};
    }));
    searchScores = searchScores.concat(scoreByTags.map(function(score) {
      return {title: score.title, field: "tags", _id: score._id, composer: score.composer, arranger: score.arranger, voiceType: score.voiceType, notes: score.notes, tags: score.tags};
    }));

    console.log(searchScores);
    //set the search options to the search results
    if (searchScores) {
      instance.searchOptions.set(searchScores);
      console.log(searchScores);
    } else {
      instance.searchOptions.set(["No Results"]);
      console.log("no results");
    }
  },
  //input property change
  'input #search': function(event, instance) {
    //we are checking if the value starts with Add:, if it is, we want to redirect to the add_score page and send the search value
    //empty the search bar
    console.log(document.getElementById('search').value);

    if (document.getElementById('search').value.startsWith('Add:')) {
      //remove the Add: from the search value
      
      instance.search.set(document.getElementById('search').value.substring(4));
      document.getElementById('search').value = '';
      BlazeLayout.render('main', {content: 'add_score', search: instance.search.get()});
    }
    //if the value starts with View:, we want to redirect to the view_score page and send the search value
    if (document.getElementById('search').value.startsWith('View:')) {
      //remove the View: from the search value
      id = document.getElementById('search').value.substring(5);
      score = Scores.findOne({_id: id});
      console.log(id, JSON.stringify(score));
      BlazeLayout.render('main', {content: 'view_score', score: score});
      document.getElementById('search').value = '';
    }
    
  },  //viewScore
  'click #view_score': async function(event, instance) {
    event.preventDefault();
    //get the id from the link's data-id attribute
    var id = event.target.getAttribute('data-id');
    score = await Scores.findOneAsync({_id: id});
    console.log(id, score);
    //redirect to the view_score page with the search value
    BlazeLayout.render('main', {content: 'view_score', score: score});
  },
  //home button click
  'click #home'(event, instance) {
    event.preventDefault();
    //redirect to the home page
    BlazeLayout.render('main', {content: 'dashboard'});
  }
});
//main subscription
Template.main.onCreated(function() {
  //subscribe to the scores publication
  Meteor.subscribe('scores');
});

//view score onCreated
Template.view_score.onCreated(function() {
  //subscribe to the scores publication
  Meteor.subscribe('scores');
  //reactive var for the selected score
  this.selectedScore = new ReactiveVar({});
});

//view score onRendered
Template.view_score.onRendered(function() {
  //get the search value from the flow router params
  var score = Blaze.getData();
  
  console.log("score: " + score);
  this.selectedScore.set(score);
  this.edit = new ReactiveVar(false);
});

//view score helpers
Template.view_score.helpers({
  //selected score
  selectedScore() {
    return Template.instance().selectedScore.get();
  },
  //edit
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
    user.roles = await Roles.getRolesForUserAsync(user._id);
    return user;
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
    //get the email from the data-id attribute of the button
    var email = event.target.getAttribute('data-id');
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
    //get the email from the data-id attribute of the button
    var email = event.target.getAttribute('data-id');
    
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
    //get the email from the data-id attribute of the button
    var email = event.target.getAttribute('data-id');
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

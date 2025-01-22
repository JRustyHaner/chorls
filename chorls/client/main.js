import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/pwix:blaze-layout';
import { Accounts } from 'meteor/accounts-base';
import Papa from 'papaparse';
//roles
import { Roles } from 'meteor/alanning:roles';

import './main.html';

//organizations have name, custom url, and a list of user ids, and an invite key
Organizations = new Mongo.Collection('organizations');
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
  'click #listAll'(event, instance) {
    event.preventDefault();
    //redirect to the listAll page
    BlazeLayout.render('main', {content: 'listAll'});
  },
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
    //if the search bar value is empty, clear the search options
    if (search == '') {
      instance.searchOptions.set([]);
      return;
    }
    instance.search.set(search);
    console.log(search);
    //search any score that has the search value in any of the fields and report on which fields the search value was found. If multiple fields have the search value, the score is returned once, listing all the fields that have the search value
    //search is case insensitive
    //search is a substring search
    //get all the scores
    var scores = Scores.find({}).fetch();
    //search the scores for the search value
    var searchScores = [];
    //split the search terms by space
    search = search.split(' ');
    //search each term
    for (var k = 0; k < search.length; k++) {
      var searchTerm = search[k];
      for (var i = 0; i < scores.length; i++) {
        //get the score
        var score = scores[i];
        //get the score fields
        var fields = Object.keys(score);
        //remove the _id field, number_of_copies, and number_of_originals
        fields.splice(fields.indexOf('_id'), 1);
        fields.splice(fields.indexOf('number_of_copies'), 1);
        fields.splice(fields.indexOf('number_of_originals'), 1);
        //search the fields for the search value
        for (var j = 0; j < fields.length; j++) {
          //get the field
          var field = fields[j];
          //get the value of the field
          var value = score[field];
          //if the value is a string and the search value is a substring of the value
          if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
            //add the score to the searchScores array with the field that has the search value
            score.field = field;
            score.id = score._id;
            //generate a value that is the value with the search term bolded in HTML
            score.value = value.replace(new RegExp(searchTerm, 'gi'), function (str) {
              return '<strong>' + str + '</strong>';
            });
            searchScores.push(score);
            break;
          }
        }
      }
    }
    console.log(searchScores);
    instance.searchOptions.set(searchScores);
  },
  'click #importexport'(event, instance) {
    event.preventDefault();
    //redirect to the importexport page
    BlazeLayout.render('main', {content: 'importexport'});
  },
  //if the mouse leaves or is clicked outside of the search bar, clear the search options
  'click #outside'(event, instance) {
    instance.searchOptions.set([]);
    //set the search bar value to empty
    document.getElementById('search').value = '';
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
    instance.searchOptions.set('');
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

//importexport events
Template.importexport.events({
  //import button click, import_file is the id for the file field
  'click #import'(event, instance) {
    event.preventDefault();
    //get the file from the input field
    var file = document.getElementById('import_file').files[0];
    //if there is no file, alert the user
    if (!file) {
      alert('No file selected');
      return;
    }
    //read the file (csv to json)
    var reader = new FileReader();
    reader.onload = function(e) {
      //parse the csv
      var csv = e.target.result;
      var scores = Papa.parse(csv, { header: true }).data;
      //make a meteor async call to import the scores
      Meteor.call('importScores', scores, function(error, result) {
        if (error) {
          console.log(error);
        } else {
          console.log(result);
        }
      });
      alert('Scores Imported');
    };
  },
  //export button click
  'click #export'(event, instance) {
    event.preventDefault();
    //make a meteor async call to export the scores to csv. Call the collecion directly
    allScores = Scores.find({}).fetch();
    //convert to csv and download
    var csv = Papa.unparse(allScores, { header: true });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href
    link.setAttribute('href', url);
    link.setAttribute('download', 'scores.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    var accompaniment = document.getElementById('view_accompaniment').value;
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
      accompaniment: accompaniment,
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
      accompaniment: accompaniment,
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
    Meteor.call('registerUser', {
      email: email,
      role: role,
    }, function(error, result) {
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
      accompaniment: document.getElementById('input_accompaniment').value,
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
    document.getElementById('input_composer').value = '';
    document.getElementById('input_arranger').value='';
    document.getElementById('input_composer').value='';
    document.getElementById('input_number_of_originals').value='';
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
    Meteor.callAsync('serverConsole', 'logging in as ' + username);
    //make a meteor async call to login
    Meteor.loginWithPassword(username, password, async function(error) {
      if (error) {
        Meteor.callAsync('serverConsole', 'error logging in: ' + error + ' ' + username);
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
  'click #register': async function(event, instance) {
    event.preventDefault();
    console.log("registering");
    //get the username and password from the input fields
    var signupEmail = document.getElementById('signupEmail').value;
    var signupPassword = document.getElementById('signupPassword').value;
    var organization_key = document.getElementById('organizationCode').value;
    console.log(signupEmail, signupPassword, organization_key);
    //make a meteor async call to register.
    let newuser = await Meteor.callAsync('registerUser', 
      {
      username: signupEmail,
      password: signupPassword,
      organization_key: organization_key
      }
    );
    if (newuser.status == 'error') {
      console.log(newuser.message);
      alert("Error registering user: " + newuser.message);
      BlazeLayout.render('main', {content: 'login'});
    } else {
      console.log("registered");
      Meteor.call('serverConsole', 'registered user ' + username);
      //login the user
      Meteor.loginWithPassword(username, password, function(error) {
        //if the organization is new, redirect to the organization page, otherwise redirect to the dashboard
        if (error) {
          console.log(error);
          alert('Invalid Username or Password, please try again');
        }
        if (new_organization) {
          BlazeLayout.render('main', {content: 'organization'});
        } else {
          BlazeLayout.render('main', {content: 'dashboard', scores: Scores.find({}).fetch()});
        }
      });
    }

  },
  'click .nav-tabs'(event, instance) {
    //if loginForm is visible, hide it and show signupForm, or vice versa
    event.preventDefault();
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');
    //we know by d-none if the form is visible or not
    if (loginForm.classList.contains('d-none')) {
      loginForm.classList.remove('d-none');
      signupForm.classList.add('d-none');
    } else {
      loginForm.classList.add('d-none');
      signupForm.classList.remove('d-none');
    }
  }

});

//organization page helpers
//organization helper returns the current users organization
Template.organization.helpers({
  organization: function() {
    //get the current user
    var user = Meteor.user();
    //get the organization
    var organization = Organizations.findOne({ _id: user.organization });
    //map the users in the organization to their emails
    organization.users = organization.user_ids.map(function(user_id) {
      return Meteor.users.findOne({ _id: user_id }).username;
    });
    return organization;
  }
});

//organization page events, update the organization name and url
Template.organization.events({
  'click #update_organization'(event, instance) {
    event.preventDefault();
    //get the organization name and url from the input fields
    var name = document.getElementById('organization_name').value;
    var url = document.getElementById('organization_url').value;
    //make a meteor async call to update the organization
    Meteor.call('updateOrganization', {
      name: name,
      url: url,
    }, function(error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    alert('Organization Updated');
  }
});



//listAll template. Needs ro have a allScores helper and a allFields helper that contains all unique field values for the tag, section, and voiceType fields
//listAll template also needs a reactive var for the filters, it should be an array of objects with the fields tag, section, and voiceType
Template.listAll.onCreated(function() {
  //subscribe to the scores publication
  Meteor.subscribe('scores');
  //reactive var for the filters
  this.filters = new ReactiveVar([]);
  //active var for active filter
  this.activeFilter = new ReactiveVar([]);
});
//allScores is an array of objects that contain all the scores, allFields is an object that contains arrays of unique values for the tag, section, and voiceType fields
Template.listAll.helpers({
  //all scores
  allScores: function() {
    filters = Template.instance().activeFilter.get();
    console.log("filters: " + JSON.stringify(filters));
    //if there are no filters, return all the scores
    if (filters.length == 0) {
      //order the scores by title
      return Scores.find({}, { sort: { title: 1 } }).fetch();
    }
    //get all the scores
    scores = Scores.find({}).fetch();
    //filter the scores by the filters
    filters.forEach(function(filter) {
      console.log("filter: " + JSON.stringify(filter));
      //make sure the value is not empty
      if (filter.value != '') {
        scores = scores.filter(function(score) {
          //if the filter field is tags, check if the score has the tag
          if (filter.field == 'tags') {
            return score.tags == filter.value;
          }
          //if the filter field is section, check if the score has the section
          if (filter.field == 'section') {
            return score.section == filter.value;
          }
          //if the filter field is voiceType, check if the score has the voiceType
          if (filter.field == 'voiceType') {
            return score.voiceType == filter.value;
          }
        });
      }
    });
    console.log("filtered scores: " + JSON.stringify(scores));
    //order the scores by title
    return scores;
  },
  //all fields is an array of objects that contain an array of unique values for the tag, section, and voiceType fields
  allFields: function() {
    //get all unique values for the tag, section, and voiceType fields
    var filters = Template.instance().filters.get();
    //filters are an array of objects with the fields key and value
    //get all the scores
    scores = Scores.find({}).fetch();
    //for each score, get the tag, section, and voiceType fields
    scores.forEach(function(score) {
      //the output is an array of objects with the fields key and value
      //get this score's tag, section, and voiceType fields
      var tag = score.tags;
      //split the tags into an array. They are space separated.
      tag = tag.split(' ');
      var section = score.section;
      var voiceType = score.voiceType;
      //if the tag is not in the filters, add it
      tag.forEach(function(tag) {
        if (!filters.includes({ field: 'tags', value: tag })) {
          //make sure the tag is not empty
          if (tag != '') {
            filters.push({ field: 'tags', value: tag });
          }
        }
      });
      //if the section is not in the filters, add it
      if (!filters.includes({ field: 'section', value: section })) {
        //make sure the section is not empty
        if (section != '') {
          filters.push({ field: 'section', value: section });
        }
      }
      //if the voiceType is not in the filters, add it
      if (!filters.includes({ field: 'voiceType', value: voiceType })) {
        //make sure the voiceType is not empty
        if (voiceType != '') {
          filters.push({ field: 'voiceType', value: voiceType });
        } 
      }
      //check for duplicates
      filters = filters.filter((filter, index, self) =>
        index === self.findIndex((t) => (
          t.field === filter.field && t.value === filter.value
        ))
      );
    });
    console.log("available filters: " + JSON.stringify(filters));
    return filters;
  },
  //filter list helper
  filters: function() {
   //remove active filters
   allFilters = Template.instance().filters.get();
   activeFilters = Template.instance().activeFilter.get();
    //remove the active filters from the allFilters
    allFilters.each(function(filter) {
      if (filter.value == activeFilters.value) {
        allFilters.splice(allFilters.indexOf(filter), 1);
      }
    });
    return allFilters;
  },
  //active filter helper
  activeFilter: function() {
    return Template.instance().activeFilter.get();
  }
});
//listAll events for selecting a filter or clearing all filters
Template.listAll.events({
  //tag click
  'click #filter'(event, instance) {
    //get the tag value
    var field = $(event.target).attr('data-field');
    var value = $(event.target).attr('data-value');
    //get the filters
    var filters = instance.activeFilter.get();
    //if the tag is already in the filters, remove it, otherwise add it
    if (filters.includes({ field: field, value: value })) {
      filters.splice(filters.indexOf({ field: field, value: value }), 1);
    } else {
      filters.push({ field: field, value: value });
    }
    //set the filters1
    instance.activeFilter.set(filters);

  },
  //remove filter click
  'click #remove_filter'(event, instance) {
    //get the tag value
    var field = $(event.target).attr('data-field');
    var value = $(event.target).attr('data-value');
    //get the filters
    var filters = instance.activeFilter.get();
    //remove the filter
    filters.splice(filters.indexOf({ field: field, value: value }), 1);
    //set the filters
    instance.activeFilter.set(filters);
  },
  //clear button click
  'click #clear'(event, instance) {
    //clear the filters
    instance.activeFilter.set([]);
  },
  //view score button click
  'click #view_score': function(event, instance) {
    event.preventDefault();
    //get the id from the link's data-score attribute
    var id = $(event.currentTarget).attr('data-score');
    score = Scores.findOne({_id: id});
    console.log(id, score);
    //redirect to the view_score page with the search value
    BlazeLayout.render('main', {content: 'view_score', score: score});
  }
});


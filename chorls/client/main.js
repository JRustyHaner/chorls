import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/pwix:blaze-layout';
import './main.html';

Scores = new Mongo.Collection('scores');

//routing using flow-router
FlowRouter.route('/', {
  name: 'home',
  action() {
    Meteor.callAsync('serverConsole','connected');
    //if logged in, render the main template with the content set to home
    //if not logged in, render the main template with the content set to login
    if (!Meteor.userId()) {
      Meteor.callAsync('serverConsole','not logged in');
      BlazeLayout.render('main', {content: 'login'});
    } else {
      Meteor.callAsync('serverConsole','logged in as ' + Meteor.userId());
      BlazeLayout.render('main', {content: 'dashboard'});
    }
  }
});

//flow router for add_score
FlowRouter.route('/add_score/:search', {
  name: 'add_score',
  action(params) {
    console.log("add_score, search: " + params.search);
    //render the main template with the content set to add_score, send the search value to the template
    BlazeLayout.render('main', {content: 'add_score', search: params.search});
  }
});

//add score with no search value
FlowRouter.route('/add_score', {
  name: 'add_score',
  action() {
    console.log("add_score");
    //render the main template with the content set to add_score
    BlazeLayout.render('main', {content: 'add_score'});
  }
});

//view score with the search value
FlowRouter.route('/view_score/:search', {
  name: 'view_score',
  action(params) {
    console.log("view_score, search: " + params.search);
    //render the main template with the content set to view_score, send the search value to the template
    BlazeLayout.render('main', {content: 'view_score', search: params.search});
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
  }
});

//template for isUserLoggedIn
Template.registerHelper('isUserLoggedIn', function() {
  return Meteor.userId();
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
  //add_score button click
  'click #add_score'(event, instance) {
    //redirect to the add_score page
    FlowRouter.go('/add_score');
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
    scoreByFuchs = Scores.find({fuchs: {$regex: search, $options: 'i'}}).fetch();
    scoreByNotes = Scores.find({notes: {$regex: search, $options: 'i'}}).fetch();
    scoreByTags = Scores.find({tags: {$regex: search, $options: 'i'}}).fetch();
    //combine all the search results in an object {title: title, field: field, _id: _id}
    searchScores = [];
    searchScores = searchScores.concat(scoreByTitle.map(function(score) {
      return {title: score.title, field: "title", _id: score._id};
    }));
    searchScores = searchScores.concat(scoreByComposer.map(function(score) {
      return {title: score.title, field: "composer", _id: score._id};
    }));
    searchScores = searchScores.concat(scoreByArranger.map(function(score) {
      return {title: score.title, field: "arranger", _id: score._id};
    }));
    searchScores = searchScores.concat(scoreByFuchs.map(function(score) {
      return {title: score.title, field: "fuchs", _id: score._id};
    }));
    searchScores = searchScores.concat(scoreByNotes.map(function(score) {
      return {title: score.title, field: "notes", _id: score._id};
    }));
    searchScores = searchScores.concat(scoreByTags.map(function(score) {
      return {title: score.title, field: "tags", _id: score._id};
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
  'input #search'(event, instance) {
    //we are checking if the value starts with Add:, if it is, we want to redirect to the add_score page and send the search value
    //empty the search bar

    if (document.getElementById('search').value.startsWith('Add:')) {
      //remove the Add: from the search value
      
      instance.search.set(document.getElementById('search').value.substring(4));
      document.getElementById('search').value = '';
      FlowRouter.go('/add_score/' + instance.search.get());
    }
    //if the value starts with View:, we want to redirect to the view_score page and send the search value
    if (document.getElementById('search').value.startsWith('View:')) {
      
      FlowRouter.go('/view_score/' + document.getElementById('search').value);
      document.getElementById('search').value = '';
    }
    
  }
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
  var search = FlowRouter.getParam('search');
  //get the score that has the search value in the title
  score = Scores.findOne({_id: search});
  //set the selected score reactive var to the score
  this.selectedScore.set(score);
});

//view score helpers
Template.view_score.helpers({
  //selected score
  selectedScore() {
    return Template.instance().selectedScore.get();
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
  //get the search value from the flow router params
  var search = FlowRouter.getParam('search');
  console.log("search: " + search);
  //set the search value to the search bar
  document.getElementById('input_title').value = search;
  //set the title reactive var to the search value
  this.title.set(search);
});


Template.dashboard.helpers({
  //all scores
  scores() {
    scores = Scores.find({}).fetch();
    console.log(scores);
    return scores;
  },
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
    fuchs = ""
    if (document.getElementById('input_soprano').checked) {
      fuchs += "S"
    }
    if (document.getElementById('input_alto').checked) {
      fuchs += "A"
    }
    if (document.getElementById('input_tenor').checked) {
      fuchs += "T"
    }
    if (document.getElementById('input_bass').checked) {
      fuchs += "B"
    }
    console.log(document.getElementById('input_title').value, document.getElementById('input_composer').value, document.getElementById('input_arranger').value, fuchs, document.getElementById('input_number_of_copies').value, document.getElementById('input_notes').value);
    Meteor.call('addScore', {
      title: document.getElementById('input_title').value,
      composer: document.getElementById('input_composer').value,
      arranger: document.getElementById('input_arranger').value,
      fuchs: fuchs,
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
    document.getElementById('input_soprano').checked = false;
    document.getElementById('input_alto').checked = false;
    document.getElementById('input_tenor').checked = false;
    document.getElementById('input_bass').checked = false;
    alert('Score Added');
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
    Meteor.loginWithPassword(username, password, function(error) {
      if (error) {
        console.log(error);
        alert('Invalid Username or Password, please try again');
      } else {
        console.log("logged in");
        BlazeLayout.render('main', {content: 'dashboard'});
      }
    });
  },
  'click #register'(event, instance) {
    event.preventDefault();
    console.log("registering");
    //get the username and password from the input fields
    var username = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    //make a meteor async call to register
    Accounts.createUser({
      username: username,
      password: password,
    }, function(error) {
      if (error) {
        console.log(error);
        BlazeLayout.render('main', {content: 'login'});
      } else {
        console.log("registered");
        BlazeLayout.render('main', {content: 'dashboard'});
      }
    });
  }
});

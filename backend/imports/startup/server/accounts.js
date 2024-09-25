import { Accounts } from 'meteor/accounts-base'
import { Meteor } from 'meteor/meteor'
import { 
    registerNewUser,
    updateUserProfile,
    deleteAccount
   } from '../../accounts/methods'

// Here we define the fields that are automatically 
// available to clients via Meteor.user().
// This extends the defaults (_id, username, emails) 
// by our profile fields.
// If you want your custom fields to be immediately 
// available then place them here.
const defaultFieldSelector = {
  _id: 1,
  username: 1,
  emails: 1,
  firstName: 1,
  lastName: 1
}


// merge our config from settings.json with fixed code
// and pass them to Accounts.config
Accounts.config({ 
  ...Meteor.settings.accounts.config,
  defaultFieldSelector 
})

Meteor.methods({
    registerNewUser,
    deleteAccount,
    updateUserProfile
  })
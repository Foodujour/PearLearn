var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var Link = require('react-router').Link;
var SignInContent = require('./landinghead2.jsx');
const RaisedButton = require('material-ui/lib/raised-button');


//TODOs:
//Add form validation
//Add novaldiate to forms to override default HTML 5 validation?
//Server response

var SignIn = React.createClass({
  getInitialState: function (){
    return {
      username: '',
      password: ''
    };
  },
  validateUser: function () {
    var storeUser = this.props.storeUser;
    var username = this.state.username;
    var password = this.state.password;
    var history = this.props.history;

    //Composes new user instance from current username/password state & posts to server
    var User = {
      username: username,
      password: password
    };

    $.ajax({
      type: 'POST',
      url: '/signin',
      data: User
    })
    .then(function (res){
      //TODO: check that the user is validated

      //sets the app state currentUser
      storeUser(username);

      //redirects to profile page 
      history.pushState(null, '/profile');

      //this will work but is a bit uncouth
      //also, need sessions  
      // window.location.assign("/");
    });
  },
  updateUsername: function (event) {
    this.setState({
      username: event.target.value.substr(0, 30)
    });
  },
  updatePassword: function (event) {
    this.setState({
      password: event.target.value.substr(0, 30)
    });
  },
  render: function () {
    return (
      <div className="sign-in-view">
      <div className="push"></div>
        <div className="row">
          <div className="input-field col s4 offset-s4 z-depth-5">
            <h5 className="signin-header">Sign In</h5>
            <input type="text" className="username-input" placeholder="Enter Username" onChange={this.updateUsername}/>
            <input type="password" className="password-input" placeholder="Enter Password"  onChange={this.updatePassword}/> 
            <RaisedButton fullWidth ={true} label="Sign In" className="submit-button" onClick={this.validateUser}/>
            <p className="signin-footer">Not yet registered? <Link to='/signup'>Sign up!</Link></p>
          </div>
        </div>
      </div>
    )
  }
});

module.exports = SignIn;

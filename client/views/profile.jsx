var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var Modal = require('react-modal');
var Link = require('react-router').Link;
const Card = require('material-ui/lib/card/card');
// const Card = require('material-ui/lib/card/card-expandable')
const CardHeader = require('material-ui/lib/card/card-header');
const CardText = require('material-ui/lib/card/card-text');
const CardActions = require('material-ui/lib/card/card-actions');

const Avatar = require('material-ui/lib/avatar');
const IconButton = require('material-ui/lib/icon-button');
const RaisedButton = require('material-ui/lib/raised-button');


// Modal options see: https://www.npmjs.com/package/react-modal
var customStyles = {

  overlay : {
    position          : 'fixed',
    top               : 0,
    left              : 0,
    right             : 0,
    bottom            : 0,
    backgroundColor   : 'rgba(0, 0, 0, 0.75)',
  },

  content : {
    top                   : '53%',
    left                  : '50%',
    right                 : '-20%',
    bottom                : 'auto',
    marginRight           : '0',
    transform             : 'translate(-50%, -50%)'
  }
};

// This is one BIG component. Will need to break this down somehow.
var Profile = React.createClass({

  // Set the initial value input fields (using dummy data for now) and state of modal
  getInitialState : function() {
    return {
      modalIsOpen : false,
      nameValue : '',
      aboutValue : '',
      locationVal: '',
      websiteVal: '',
      githubVal: '',
      joinedVal: '',
      interestsValue : ''
    };
  },

  // This fires right before the component mounts. This is where we'll get user profile data.
  componentWillMount: function() {
    var self = this;
    var currentUser = this.props.currentUser;
    //this is a pretty hacky fix to the fact
    //that we don't know how sessions work
    //in passport
    if (!currentUser){
      this.props.history.pushState(null, '/signin');
    }

    $.ajax({
      type : 'GET',
      url : '/users/' + currentUser,
      success : function(res) {
        console.log('self is mounted? ', self.isMounted());
        console.log('get response: ', res);
        if (self.isMounted()) {
          self.setState({
            nameValue : res.name,
            aboutValue : res.about,
            locationVal: res.location,
            websiteVal: res.website,
            githubVal: res.github,
            joinedVal: res.joined,
            interestsValue : res.interests.join(',')
          });

        }
      }
    });
  },

  openModal : function() {
    this.setState({modalIsOpen: true});
  },

  closeModal : function() {
    this.setState({modalIsOpen: false});
  },

  // Handlers for user input fields. Updates state (value of input)
  updateName : function(event) {
    this.setState({ nameValue : event.target.value });
  },

  updateAbout : function(event) {
    this.setState({ aboutValue : event.target.value });
  },

  updateLocation : function(event) {
    this.setState({ locationVal : event.target.value });
  },

  updateWebsite : function(event) {
    this.setState({ websiteVal : event.target.value });
  },

  updateGithub : function(event) {
    this.setState({ githubVal : event.target.value });
  },

  updateInterests : function(event) {
    this.setState({ interestsValue : event.target.value });
  },

  saveData : function() {
    var currentUser = this.props.currentUser;
    var interests = this.state.interestsValue.split(',');


    var data = {
      name : this.state.nameValue,
      about : this.state.aboutValue,
      location: this.state.locationVal,
      website: this.state.websiteVal,
      github: this.state.githubVal,
      interests : interests
    };
    console.log(data);
    $.ajax({
      type : 'POST',
      dataType : 'json',
      url : '/users/' + currentUser,
      data : data
    });
    this.setState({ modalIsOpen : false });
  },

  // Render all the things!
  render : function () {
    var name = this.state.nameValue;
    var about = this.state.aboutValue;
    var location = this.state.locationVal;
    var website = this.state.websiteVal;
    var github = this.state.githubVal;
    var joined = this.state.joinedVal;
    var interests = this.state.interestsValue;
    //styles vars
    var avatarL = name ? name[0]:'';
    var url = 'http://';
    var git = 'https://github.com/';
    return (<div>
              <div className="container">
                <div className="row">
                  <div className="col s8 offset-s2">
                    <div className="card blue-grey darken-1">
                      <div className="card-content white-text">
                        <span className="card-title">
                          <Avatar style={{backgroundColor:'white',color:'#546e7a'}}>{avatarL}</Avatar>
                          <span>      {name}'s Profile</span>
                        </span>
                        <div className="card-action">
                          <div className="profile-text">Name: {name}</div>
                          <div className="profile-text">Location: {location}</div>
                          <div className="link-text">Website: <a className ="link-text" href='#'>{url}{website}</a></div>
                          <div className="link-text">Github:  <a className ="link-text" href='#'>{git}{github}</a></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col s8 offset-s2">
                    <Card initiallyExpanded={true}>
                      <CardHeader
                        title="About"
                        subtitle={name}
                        avatar={<Avatar style={{backgroundColor:'#546e7a',color:'white'}}>A</Avatar>}>
                      </CardHeader>
                      <CardText expandable={true}>
                        <h6>About:</h6>
                        <p>{about}</p>
                        <h6>Interest:</h6>
                        <p>{interests}</p>
                      </CardText>
                      <div className='push'></div>
                      <RaisedButton fullWidth ={true} label="Edit Profile" className="edit-profile" onClick={this.openModal}/>
                    </Card>
                  </div>
                </div>
              </div>
              <Modal
                isOpen={this.state.modalIsOpen}
                onRequestClose={this.closeModal}
                style={customStyles}>
                <div className="edit-field-p"><span className="edit-field">Name (Username to be displayed to other users)</span>
                  <input type="text" value={name} onChange={this.updateName} />
                </div>
                <div className="edit-field-p"><span className='edit-field'>About (Tell us about you!)</span>
                  <input type="text" value={about} onChange={this.updateAbout} />
                </div>
                <div className="edit-field-p"><span className="edit-field">Location (ex Austin,Tx)</span>
                  <input type="text" maxLength="12" value={location} onChange={this.updateLocation} />
                </div>
                <div className="edit-field-p"><span className="edit-field">Website (Your Website Address)</span>
                  <input type="text" value={website} onChange={this.updateWebsite} />
                </div>
                <div className="edit-field-p"><span className="edit-field">Github (Your Handler)</span>
                  <input type="text" value={github} onChange={this.updateGithub} />
                </div>
                <div className="edit-field-p"><span className="edit-field">Programming Language Interests (ex Javascript, Ruby, C++)</span>
                  <input type="text" value={interests} onChange={this.updateInterests} />
                </div>
                <div className='push'></div>
                <RaisedButton fullWidth ={true} label="Save Changes" className="edit-save" onClick={this.saveData}/>
                </Modal>
            </div>
            );
  }
})

module.exports = Profile;

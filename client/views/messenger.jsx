var React = require('react');
var $ = require('jquery');
const RaisedButton = require('material-ui/lib/raised-button');
var download = require('../lib/download');

var peer = null;
var cons = {};
var file = null;
var fileInfo = {};
var mediaStream = null;
var localCall = null;
var currentCall = null;

var reader = new FileReader();
// For compatibility with different browsers
// navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
   getUserMedia: function(c) {
     return new Promise(function(y, n) {
       (navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia).call(navigator, c, y, n);
     });
   }
} : null);

var getFileType = function(fileType) {
  if (fileType.match(/image.*/)) {
    return 'image';
  } else if (fileType.match(/text.*/)) {
    return 'text';
  } else {
    return 'text';
  }
};

//an individual contact component
var Contact = React.createClass({

  selectUser: function() {
    console.log('Contact - this.props:', this.props);
    var contact = this.props.contact;
    var currentUser = this.props.currentUser;
    var peerCon = peer.connect(contact);
    var connectionState = this.props.connectionState;
    cons[this.props.contact] = {};
    cons[this.props.contact].con = peerCon;
    cons[this.props.contact].connected = false;
    cons[this.props.contact].state = {};

    var userPeer = cons[this.props.contact];

    console.log('Contact peerCon:', peerCon);
    peerCon.on('open', function() {
      userPeer.connected = true;
      console.log('Connected to peer:', contact);
      connectionState(true);
      var toSend = {
        type: 'message',
        data: 'Hi ' + contact + '! I am ' + currentUser
      };
      peerCon.send(toSend);
    });

    peerCon.on('close', function() {
      userPeer.connected = false;
      connectionState(false);
      delete cons[contact]; // maybe just set it to empty object?
      console.log('peerCon closed');
    });

    this.props.userSelected(this.props.contact);
  },

  render: function(){
    return (
      <p onClick={this.selectUser}>{this.props.contact}</p>
    );
  }
});

//the component for the list for all the contacts
var Contacts = React.createClass({
  getInitialState: function(){

    //the empty array
    //a placeholder until the
    //server sends data
    return {contacts: []}

  },
  componentDidMount: function(){
    var component = this;
    var currentUser = this.props.currentUser;

    $.ajax({
      type: 'GET',
      url: '/users'
    })
    .then(function(res){
      var state = {contacts: []}
      if (Array.isArray(res.users)) {
        res.users.forEach(function(user){
          if (user.username !== currentUser){
            state.contacts.push(user.username);
          }
        })
      }

      // if (!component.props.otherUser){
      //   var firstContact = state.contacts[0];
      //   component.props.displayConversation(firstContact);
      // }

      //setting the state will automatically re-render
      component.setState(state);
    })
  },
  userSelected: function(username){
    this.props.displayConversation(username);
  },
  render: function(){

    var userSelected = this.userSelected;
    var currentUser = this.props.currentUser;
    var connectionState = this.props.connectionState;
    var contacts = this.state.contacts.map(function(contact){
      return ( <div className="z-depth-1 grey-text text-lighten-1"><Contact currentUser={currentUser} userSelected={userSelected} key={contact} contact={contact} connectionState={connectionState} /></div> )
    })

    return (
      <div className="col s3">
        <div className="card blue-grey darken-1">
          <div className="contacts">
            <div className="card-content">
              <h4 className="white-text">Contacts</h4>
              {[contacts]}
            </div>
          </div>
        </div>
      </div>
    )
  }
});

//the username of the other user in the conversation
var OtherUser = React.createClass({
  render: function(){
    return (
      <h5>{this.props.otherUser}</h5>
    );
  }
});

//the component for an individual message in a conversation
var Message = React.createClass({
  render: function(){
    return (
      <div>{this.props.message.text}</div>
    );
  }
});

//the component for submitting a new message
var NewMessage = React.createClass({
  sendMessage: function(text){
    var update = this.props.update;
    var currentUser = this.props.currentUser;
    var message = {
      'to': this.props.otherUser,
      'from': currentUser,
      'text': this.refs.message.value
    };

    $.ajax({
      type: 'POST',
      url: '/messages',
      data: message,
      success: function(res){
        //should re-render page;
        update();
      }
    })
  },
  render: function(){
    return (
      <div className="row messageInput">
        <input className="col s9" id="mess" ref="message" type="text" placeholder="Type here"></input>
        <a id="messButton" label="Send" type="button" className="btn btn-small"
          onClick={this.sendMessage}>+</a>
      </div>
    )
  }
});

//the component for the entire conversation with one other user
var Conversation = React.createClass({
  render: function(){
    var currentUser = this.props.currentUser;
    var otherUser = this.props.otherUser;
    var conversation = this.props.conversation.messages.map(function(message){
      //checks if the message in incoming or outgoing
      //for styling purposes
      if (message.to === currentUser){
        var className = 'incoming';
        var user = otherUser;
      }
      else {
        var className = 'outgoing';
        var user = currentUser;
      }

      return <div className={className}><Message key={message.text} message={message} currentUser={currentUser}/></div>
    })

    return (
      <div>
        <OtherUser otherUser={this.props.conversation.username}/>
        <NewMessage currentUser={currentUser}
                    otherUser={this.props.conversation.username}
                    update={this.props.update}/>
        {[conversation]}
      </div>
      )
  }
});

//the component for every conversation
var Conversations = React.createClass({
  getInitialState: function(){
    return {conversations: []}
  },
  componentDidMount: function(){
    var update = this.update;

    //grabs the initial message data
    update();

    //checks for new messages every two seconds
    setInterval(update, 2000);
  },
  update: function(){
    var component = this;
    var currentUser = this.props.currentUser;

    if (this.isMounted()){
      $.ajax({
        type: 'GET',
        url: '/messages/'+currentUser
      })
      .then(function(res){
        //gives conversation data to the state and automatically re-renders
         component.setState(res);
      })
    }
  },
  render: function(){
    var otherUser = this.props.otherUser;
    var currentUser = this.props.currentUser;
    var conversation = {username: otherUser, messages: []}

    //grabs any messages from the state
    this.state.conversations.forEach(function(conv){
      if (conv.username === otherUser){
        conversation.messages = conv.messages;
      }
    })

    if (this.props.otherUser) {
      return (
        <div className="col s4">
          <div className="card grey lighten-3">
            <div className="card-content">
              <Conversation key={conversation.messages}
                            conversation={conversation}
                            update={this.update}
                            currentUser={currentUser}/>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="col s4">
          <div className="card grey lighten-3">
            <div className="card-content">
              Select a contact to connect with.
            </div>
          </div>
        </div>
      )
    }
  }
});

//the main component
var Messenger = React.createClass({
  getInitialState: function(){
    return {
      //other user represents the user whose conversation
      //is currently being displayed

      //this can be intially set to a particular user when
      //linked from the otherUsers page or it will be auto
      //set to the first user on the list
      otherUser: this.props.messageTo,
      inCall: false,
      mediaStreamPerms: false
    }
  },

  displayConversation: function(username){
    this.setState({otherUser: username});
  },

  componentWillMount: function(){
    var self = this;
    console.log('Messenger will mount')
    //this is a pretty hacky fix to the fact
    //that we don't know how sessions work
    //in passport
    if (!this.props.currentUser){
      this.props.history.pushState(null, '/signin');
      return;
    }

    peer = new Peer(this.props.currentUser, {
      host: window.location.hostname,
      port: process.env.PORT, // provided to client by envify
      path: '/peerjs'
    });

    peer.on('connection', function(con) {
      console.log('New connection');
      con.on('data', function(data) {
        if (data.dataType === 'file') {
          self.receiveFile(data);
        }
      });
    });

    peer.on('disconnected', function(data) {
      console.log('Peer disconnected', data);
      peer = new Peer(self.props.currentUser, {
        host: window.location.hostname,
        port: process.env.PORT,
        path: '/peerjs'
      })
    });




    // Handle call related events
    peer.on('call', function(call) {
      currentCall = call;

      console.log('Got a new call!!', currentCall);

      currentCall.on('stream', function(stream) {
        console.log('stream PEER>ON ASDASF')
        // $('#videoStream').prop('src', URL.createObjectURL(stream));
        self.setUpPlayer(stream);
      });

      currentCall.on('close', function(data) {
        console.log('call closed:', data);
        self.hangUp();
      });

      console.log('setting inCall state true')

      // This should be in its own method (its reused elsewhere), just dont have time to refactor
      // Try to get permission for video calling
      if (self.state.mediaStreamPerms !== true) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function(stream) {
          self.setState({ mediaStreamPerms: true });
          mediaStream = stream;
          currentCall.answer(mediaStream);
        })
        .catch(function(err) {
          localCall = null;
          mediaStream = null;
          console.log('Error getting video permissions:', err);
        });
      } else {
        currentCall.answer(mediaStream);
      }

    });

    peer.on('error', function(err) {
      console.log('Peer error:', err);
    });

  },

  setUpPlayer: function(stream) {
    this.setState({ inCall: true });
    $('#videoStream').prop('src', URL.createObjectURL(stream));
  },

  selectFile: function(e) {
    var self = this;
    var el = e.target;
    console.log('we are doing stuff!!!!', e);
    if (!el.files.length) {
      this.setState({ hasFile: false });
    } else {
      var file = el.files[0];
      var type = getFileType(file.type);
      console.log('File got!', file);

      reader.onload = function() {
        fileInfo = {
          dataType: 'file',
          name: file.name,
          lastModified: file.lastModified,
          size: file.size,
          type: type,
          mimeType: file.type || 'text/plain',
          info: reader.result
        };
      };

      reader.onloadend = function() {
        self.setState({ hasFile: true, fileInfo: file.name, displayArea: reader.result});
      };

      if (type === 'image') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  },

  sendFile: function() {
    var other = this.state.otherUser;
    console.log('Inside sendFile', other, cons[other], this.props);
    if (this.isValidCon()) {
      console.log('Sending file:', other, fileInfo);
      cons[other].con.send(fileInfo);
    }
  },

  receiveFile: function(data) {
    console.log('Got file:', data);
    this.setState({ fileInfo: data.name, displayArea: data.info });
  },

  downloadFile: function() {
    // TODO : make work with images too, the data is sent already
    download(this.state.displayArea, this.state.fileInfo, 'text/plain');
  },

  isValidCon: function() {
    var other = this.state.otherUser;
    // console.log('isValidCon', cons[other].con);
    if (other && cons[other] && cons[other].con.open) {
      return true;
    }
    return false;
  },

  displaySelectFile: function() {
    console.log('Select file');
    if (!this.isValidCon()) {
      return null;
    }

    // if (cons[other] !== undefined && cons[other].peer.open) {
    //   console.log('here');
      return (
        <a className="selectFile">
          <input className="fileCard" type="file" onChange={this.selectFile} />
          Select File
        </a>
      )
    // }
    // return null;
  },

  displaySendButton: function() {
    // var other = this.state.otherUser;
    // console.log('displaySendButton:', other);
    if (!this.isValidCon()) {
      return null;
    }

    return (
      <a className="fileCard" onClick={this.sendFile}>
        <span>Send File</span>
      </a>
    )
  },

  displayDownloadButton: function() {
    if (!this.isValidCon()) {
      return null;
    }

    return (
      <a className="fileCard" onClick={this.downloadFile}>
        <span>Download File</span>
      </a>
    )
  },

  displayVideoCall: function() {
    var self = this;

    if (!self.isValidCon()) {
      return null;
    }

    if (this.state.mediaStreamPerms === true) {
      console.log('Have media perms');
    }

    var callEl = null;

    if (this.state.inCall === true) {
      callEl = (<a href="#" onClick={this.hangUp}>Hang Up</a>);
    } else {
      callEl = (<a href="#" onClick={this.call}>Call</a>);
    }

    // <a href="#" onClick={this.call}>Call</a>
    // <a href="#" onClick={this.hangUp}>Hang Up</a>

    return (
      <div className="vidWindow card blue-grey darken-1">
        <div className="card-content">
          <div className="video-container videoPlaceholder">
            <div className="z-depth-1" id="videoContainer"><video className="responsive-video" id="videoStream" autoPlay></video></div>
          </div>
        </div>
        <div className="card-action">
          {callEl}
        </div>
      </div>
    )
  },

  buildPeerDisplay: function() {
    if (this.isValidCon()) {
      return (
          <div className="row card blue-grey darken-1">
            <div className="card-content white-text">
              <div className="card-action" id="topCard">
                <div className="row valign-wrapper">
                  <div className="col s8 center-align valign">
                    <div className="file-field">
                      {this.displaySelectFile()}
                    </div>
                  </div>
                  <div className="col s8 center-align valign">
                    {this.displaySendButton()}
                  </div>
                </div>
              </div>
              <div className="z-depth-2">
                <div className="card-title">
                  {this.state.fileInfo}
                </div>
                <div>
                  <pre className="z-depth-1">{this.state.displayArea}</pre>
                </div>
              </div>
              <div className="card-action">
                {this.displayDownloadButton()}
              </div>
            </div>
          </div>
      )
    }
    return null;
  },

  call: function() {
    var self = this;
    var other = this.state.otherUser;
    console.log('Calling', other);
    if (!this.isValidCon()) {
      return;
    }

    // Try to get permission for video calling
    if (this.state.mediaStreamPerms !== true) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(function(stream) {
        self.setState({ mediaStreamPerms: true });
        mediaStream = stream;
        // $('#videoStream').prop('src', URL.createObjectURL(mediaStream));
        localCall = peer.call(other, mediaStream);
        localCall.on('close', function() {
          self.hangUp();
          console.log('close asdfkljasdjfadskfjal');
        })
        localCall.on('stream', function(stream) {
          self.setUpPlayer(stream);
          console.log('asdfasdfasdfkajffkjlsfjaklsd')
        })
      })
      .catch(function(err) {
        localCall = null;
        mediaStream = null;
        console.log('Error getting video permissions:', err);
      });
    }


  },

  hangUp: function() {
    console.log('Hang up', this.state.otherUser);
    if (!this.isValidCon()) {
      // Somehow they are "in a call" but not connected to anything, gracefully hang up
    }

    console.log('Closing call')
    try {
      // mediaStream.stop() is gonna be deprecated, this is supposed to be how to handle it after deprecation but it does not
      // if (mediaStream.getVideoTracks) {
      //     // get video track to call stop on it
      //     var tracks = mediaStream.getVideoTracks();
      //     if (tracks && tracks[0] && tracks[0].stop) tracks[0].stop();
      // } else {
      //   mediaStream.stop();
      // }
      mediaStream.stop();
      currentCall.close();
      localCall.close();
    } catch (err) {
      try {
        localCall.close();
      } catch (err) {
        localCall = null;
      }
      // Error closing localCall most likely
    }
    this.setState({ mediaStreamPerms: false, inCall: false });
    // }
  },

  connectionState: function(open) {
    open = !!open;
    console.log('Setting connected state');
    this.setState({ connected: open });
  },

  render: function() {
    return (
      <div className="row" id="nosideMargin">
        <Contacts displayConversation={this.displayConversation}
                  otherUser={this.state.otherUser}
                  currentUser={this.props.currentUser} connectionState={this.connectionState} />
        <Conversations otherUser={this.state.otherUser}
                        currentUser={this.props.currentUser} />
        <div className="col s5">

          <div className="row">
            {this.displayVideoCall()}
          </div>

          {this.buildPeerDisplay()}

        </div>
      </div>
    )
  }
});

module.exports = Messenger;

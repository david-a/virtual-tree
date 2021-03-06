
var myDataRef = new Firebase('https://virtual-tree.firebaseio.com/');

function parseParam(val) {
    var result = null,
        tmp = [];
    location.search
    .substr(1)
        .split("&")
        .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
    return result;
}

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    var that = this;
    myDataRef.child('trees').on("value", function(snapshot) {
      var snap = snapshot.val();
      var comments = $.map(snap, function(comment){return {author: comment.author, school: comment.school, plantedAt: comment.plantedAt}}).reverse()
      that.setState({data: comments, numOfTrees: comments.length + " עצים"});
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
  },
  getInitialState: function() {
    return {data: [], numOfTrees: "טוען..."};
  },
  updateIt: function(){
    this.forceUpdate();
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.updateIt, 2000);
    setTimeout(function() {
      var el = document.getElementById('credits')
      if (el.classList.contains('is-paused')){
        el.classList.remove('is-paused');
      }
    }, 300);
  },
  componentWillUnmount: function() {
    clearInterval(this.updateIt);
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    var newComments = [comment].concat(comments);
    this.setState({data: newComments});
    myDataRef.child('trees').push(comment);
  },
  render: function() {
    return (
      <div className="commentBox">
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <img src='http://res.cloudinary.com/d3d/image/upload/c_scale,h_150/v1453371028/eviathar_n67vkc.jpg' style={{marginLeft: 20}} />
          <div>
            <h1>חורשת אביתר</h1>
            <h2 style={{color: '#316600', margin: 0}}>חורשה וירטואלית לזכרו של אביתר תורג׳מן ז״ל</h2>
            <h3 style={{color: '#57b300', margin: 0}}>כרגע בחורשה: {this.state.numOfTrees}</h3>
          </div>
        </div>
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
        <CommentList data={this.state.data} />
      </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment, index) {
      return (
        <Comment key={index} author={comment.author} school={comment.school} plantedAt={comment.plantedAt} />
      );
    });
    return (
      <div className="commentList" style={{display: 'flex', flexWrap: 'wrap', flexDirection: 'row', alignItems: 'flex-end'}}>
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  getInitialState: function() {
    var timeNow = new Date().getTime();
    if (document.cookie && parseInt(readCookie('blockTrees')) > timeNow ) {
      return { showForm: 'none' };
    }
    else {
      return { showForm: 'inline-block' };
    }
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = React.findDOMNode(this.refs.author).value.trim();
    var school = React.findDOMNode(this.refs.school).value.trim();
    if (!school || !author) {
      return;
    }
    var timeNow = new Date().getTime() ;
    this.props.onCommentSubmit({author: author, school: school, plantedAt: Math.round(timeNow/1000)});
    createCookie('blockTrees',(timeNow + 420000),1);

    React.findDOMNode(this.refs.author).value = '';
    React.findDOMNode(this.refs.school).value = '';
    this.setState({showForm: 'none'})
    return;
  },
  render: function() {
    return (
      <div style={{marginBottom: 50}}>
        <div style={{display: this.state.showForm, backgroundColor: '#A4CEFA', padding: 10, margin: '10px 0'}}>
          <h3 style={{lineHeight: '1em'}}>מלא את פרטיך בכדי לשתול עץ בחורשה:</h3>
          <form className="commentForm" onSubmit={this.handleSubmit}>
            <input style={{fontSize: 16, marginLeft: 20}} type="text" placeholder="איך קוראים לך?" ref="author" maxLength={20} />
            <input style={{fontSize: 16, marginLeft: 20}} ref="school" type="text" list="schoolname" placeholder="שם בית הספר" maxLength={20} />
            <datalist id="schoolname">
              <option value="תחכמוני" />
              <option value="תומר" />
              <option value="נועם נריה" />
              <option value="מאיר" />
              <option value="קשת יהונתן" />
              <option value="רמב״ם" />
              <option value="גלבוע" />
            </datalist>
            <input style={{fontSize: 16, width: 70, backgroundColor: '#57b300', color: 'white', height: 22, border: 'none'}} type="submit" value="שתול !" />
          </form>
        </div>
      </div>
    );
  }
});

var Comment = React.createClass({
  render: function() {
    return (
      <div className="comment" style={{display: 'flex', alignItems: 'center', width: 100, height: 120, padding: 30, justifyContent: 'flex-end', flexDirection: 'column'}}>
          <Tree plantedAt={this.props.plantedAt}/>
          <span style={{textAlign: 'center'}}>{(this.props.author + ", ")}</span>
          <span style={{textAlign: 'center'}}>{this.props.school}</span>
      </div>
    );
  }
});

var Tree = React.createClass({
  getInitialState: function() {
    return {
      max: Math.floor((Math.random() * 20) + 90),
      opacity: Math.random() * 0.2 + 0.8
    };
  },
  diffInSeconds: function(){
    if(!this.props.plantedAt) {return 0}
    var timeNow = Math.round(new Date().getTime() / 1000)
    return Math.abs(timeNow - this.props.plantedAt);
  },
  treeImg: function(){
    var diffInMinutes = this.diffInSeconds()/60
    switch (true) {
      case (diffInMinutes < 2):
        return 'http://res.cloudinary.com/d3d/image/upload/v1453371002/small_hk6lsy.svg';
      case (diffInMinutes >= 2 && diffInMinutes < 4.5):
        return 'http://res.cloudinary.com/d3d/image/upload/v1453371002/medium_bw9wqw.svg';
      case (diffInMinutes >= 4.5):
        return 'http://res.cloudinary.com/d3d/image/upload/v1453371002/large_irpqwy.svg';
    }
  },
  treeSize: function(){
    var size = this.diffInSeconds()/3 + 10;
    return Math.min(size, this.state.max);
  },
  render: function() {
    return (
      <span className="comment">
        <img src={this.treeImg()} style={{opacity: this.state.opacity, height: this.treeSize()}} />
      </span>
    );
  }
});

if (parseParam("resetForm")) {
  eraseCookie("blockTrees")
}
React.render(
  <CommentBox url="/api/comments" />,
  document.getElementById('content')
);

